import gzip
import json
import tempfile
import unittest
from pathlib import Path

from research.eda.ocr_runner import process_articles_source_file


class FakeOcrClient:
    def __init__(self) -> None:
        self.calls = 0

    def recognize_markdown(self, content_base64: str, mime_type: str) -> dict:
        self.calls += 1
        return {
            "text": "Кнопка Подключить",
            "markdown": "> OCR image note\n> Кнопка: Подключить",
            "raw_response": {},
        }


def write_jsonl(path: Path, rows: list[dict]) -> None:
    with path.open("w", encoding="utf-8") as f:
        for row in rows:
            f.write(json.dumps(row, ensure_ascii=False) + "\n")


def read_jsonl(path: Path) -> list[dict]:
    with path.open("r", encoding="utf-8") as f:
        return [json.loads(line) for line in f]


class OcrRunnerTests(unittest.TestCase):
    def test_process_articles_source_file_resumes_from_existing_working_file(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            tmp = Path(tmpdir)
            input_path = tmp / "articles_source.jsonl"
            working_path = tmp / "articles_source_ocr.working.jsonl"
            final_path = tmp / "articles_source_ocr.jsonl.gz"

            source_rows = [
                {
                    "id": 1,
                    "parent_id": None,
                    "title": "VPN 1",
                    "is_published": True,
                    "rating": 5,
                    "created_at": None,
                    "updated_at": None,
                    "published_at": None,
                    "folder_path": "IT",
                    "tags": ["vpn"],
                    "raw_html": '<h1>VPN</h1><p>Open</p><p><img src="data:image/png;base64,AAAA"></p>',
                    "markdown": "VPN\n\nOpen",
                    "text_fallback": "VPN Open",
                },
                {
                    "id": 2,
                    "parent_id": None,
                    "title": "VPN 2",
                    "is_published": True,
                    "rating": 5,
                    "created_at": None,
                    "updated_at": None,
                    "published_at": None,
                    "folder_path": "IT",
                    "tags": ["vpn"],
                    "raw_html": '<h1>VPN</h1><p>Connect</p><p><img src="data:image/png;base64,BBBB"></p>',
                    "markdown": "VPN\n\nConnect",
                    "text_fallback": "VPN Connect",
                },
            ]
            write_jsonl(input_path, source_rows)
            write_jsonl(
                working_path,
                [
                    {
                        **source_rows[0],
                        "markdown_with_ocr": "VPN\n\nOpen\n\n> OCR image note\n> Кнопка: Подключить",
                        "ocr_status": "applied",
                        "ocr_blocks": [{"placeholder": "OCR_IMAGE_0", "markdown": "> OCR image note\n> Кнопка: Подключить"}],
                        "ocr_markdown": "> OCR image note\n> Кнопка: Подключить",
                        "image_stats": {
                            "inline_image_count": 1,
                            "ocr_attempted_count": 1,
                            "ocr_applied_count": 1,
                            "ocr_error_count": 0,
                        },
                    }
                ],
            )

            client = FakeOcrClient()
            stats = process_articles_source_file(
                input_path=input_path,
                working_output_path=working_path,
                final_output_path=final_path,
                ocr_client=client,
                write_batch_size=1,
                max_images_per_article=0,
                show_progress=False,
            )

            self.assertEqual(client.calls, 1)
            self.assertEqual(stats["skipped_existing"], 1)
            self.assertEqual(stats["processed"], 1)
            self.assertEqual(stats["written_batches"], 1)
            self.assertTrue(final_path.exists())
            with gzip.open(final_path, "rt", encoding="utf-8") as f:
                output_rows = [json.loads(line) for line in f]
            self.assertEqual([row["id"] for row in output_rows], [1, 2])
            self.assertIn("Кнопка: Подключить", output_rows[1]["markdown_with_ocr"])


if __name__ == "__main__":
    unittest.main()

