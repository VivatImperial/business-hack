import subprocess
import sys
import unittest
from pathlib import Path


class ChunkCliTests(unittest.TestCase):
    def test_build_chunks_help_runs_as_script(self):
        repo_root = Path(__file__).resolve().parents[1]
        script_path = repo_root / "research" / "data_preparation" / "build_chunks.py"
        result = subprocess.run(
            [sys.executable, str(script_path), "--help"],
            cwd=repo_root,
            capture_output=True,
            text=True,
        )
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("Build Qdrant-ready chunks", result.stdout)


if __name__ == "__main__":
    unittest.main()

