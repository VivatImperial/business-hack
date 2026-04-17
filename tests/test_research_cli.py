import subprocess
import sys
import unittest
from pathlib import Path


class ResearchCliTests(unittest.TestCase):
    def test_extract_datasets_help_runs_as_script(self):
        repo_root = Path(__file__).resolve().parents[1]
        script_path = repo_root / "research" / "extract_datasets.py"
        result = subprocess.run(
            [sys.executable, str(script_path), "--help"],
            cwd=repo_root,
            capture_output=True,
            text=True,
        )
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("Build research source datasets", result.stdout)
        self.assertIn("--ocr-articles", result.stdout)
        self.assertIn("--ocr-max-images-per-article", result.stdout)

    def test_ocr_articles_help_runs_as_script(self):
        repo_root = Path(__file__).resolve().parents[1]
        script_path = repo_root / "research" / "ocr_articles.py"
        result = subprocess.run(
            [sys.executable, str(script_path), "--help"],
            cwd=repo_root,
            capture_output=True,
            text=True,
        )
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("Enrich existing article source", result.stdout)
        self.assertIn("--write-batch-size", result.stdout)
        self.assertIn("--output-path", result.stdout)

    def test_embed_chunks_help_runs_as_script(self):
        repo_root = Path(__file__).resolve().parents[1]
        script_path = repo_root / "research" / "embed_chunks.py"
        result = subprocess.run(
            [sys.executable, str(script_path), "--help"],
            cwd=repo_root,
            capture_output=True,
            text=True,
        )
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("Embed chunk files", result.stdout)
        self.assertIn("--device", result.stdout)
        self.assertIn("--embed-batch-size", result.stdout)


if __name__ == "__main__":
    unittest.main()

