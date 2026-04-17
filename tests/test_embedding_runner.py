import gzip
import json
import tempfile
import unittest
from pathlib import Path

from research.data_preparation.embedding_runner import process_chunk_file


class FakeEmbedder:
    def __init__(self) -> None:
        self.calls = 0
        self.batch_sizes: list[int] = []

    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        self.calls += 1
        self.batch_sizes.append(len(texts))
        return [[float(len(text)), float(index)] for index, text in enumerate(texts)]


def write_jsonl(path: Path, rows: list[dict]) -> None:
    with path.open("w", encoding="utf-8") as f:
        for row in rows:
            f.write(json.dumps(row, ensure_ascii=False) + "\n")


class EmbeddingRunnerTests(unittest.TestCase):
    def test_process_chunk_file_resumes_from_working_file_and_writes_batches(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            tmp = Path(tmpdir)
            input_path = tmp / "ticket_cases.jsonl"
            working_path = tmp / "ticket_cases.qwen3.working.jsonl"
            final_path = tmp / "ticket_cases.qwen3.jsonl.gz"

            source_rows = [
                {
                    "point_id": "ticket:1",
                    "embedding_text": "Не работает VPN",
                    "payload": {"ticket_id": 1},
                },
                {
                    "point_id": "ticket:2",
                    "embedding_text": "Неправильный отчет в 1С",
                    "payload": {"ticket_id": 2},
                },
            ]
            write_jsonl(input_path, source_rows)
            write_jsonl(
                working_path,
                [
                    {
                        "point_id": "ticket:1",
                        "vector": [1.0, 2.0],
                        "payload": {"ticket_id": 1},
                        "embedding_model": "Qwen/Qwen3-Embedding-0.6B",
                        "embedding_dim": 2,
                    }
                ],
            )

            embedder = FakeEmbedder()
            stats = process_chunk_file(
                input_path=input_path,
                working_output_path=working_path,
                final_output_path=final_path,
                embedder=embedder,
                embedding_model="Qwen/Qwen3-Embedding-0.6B",
                embed_batch_size=8,
                write_batch_size=1,
                show_progress=False,
            )

            self.assertEqual(embedder.calls, 1)
            self.assertEqual(stats["skipped_existing"], 1)
            self.assertEqual(stats["processed"], 1)
            self.assertEqual(stats["written_batches"], 1)
            self.assertTrue(final_path.exists())
            with gzip.open(final_path, "rt", encoding="utf-8") as f:
                rows = [json.loads(line) for line in f]
            self.assertEqual([row["point_id"] for row in rows], ["ticket:1", "ticket:2"])
            self.assertEqual(rows[1]["embedding_model"], "Qwen/Qwen3-Embedding-0.6B")
            self.assertEqual(rows[1]["embedding_dim"], 2)

    def test_process_chunk_file_respects_embed_batch_size(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            tmp = Path(tmpdir)
            input_path = tmp / "article_chunks.jsonl"
            working_path = tmp / "article_chunks.qwen3.working.jsonl"
            final_path = tmp / "article_chunks.qwen3.jsonl.gz"

            source_rows = [
                {"point_id": "article:1:0", "embedding_text": "one", "payload": {"article_id": 1}},
                {"point_id": "article:1:1", "embedding_text": "two", "payload": {"article_id": 1}},
                {"point_id": "article:1:2", "embedding_text": "three", "payload": {"article_id": 1}},
            ]
            write_jsonl(input_path, source_rows)

            embedder = FakeEmbedder()
            stats = process_chunk_file(
                input_path=input_path,
                working_output_path=working_path,
                final_output_path=final_path,
                embedder=embedder,
                embedding_model="Qwen/Qwen3-Embedding-0.6B",
                embed_batch_size=2,
                write_batch_size=10,
                show_progress=False,
            )

            self.assertEqual(stats["processed"], 3)
            self.assertEqual(embedder.calls, 2)
            self.assertEqual(embedder.batch_sizes, [2, 1])
            with gzip.open(final_path, "rt", encoding="utf-8") as f:
                rows = [json.loads(line) for line in f]
            self.assertEqual(len(rows), 3)
            self.assertEqual([row["point_id"] for row in rows], ["article:1:0", "article:1:1", "article:1:2"])


if __name__ == "__main__":
    unittest.main()

