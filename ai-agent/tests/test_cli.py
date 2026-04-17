from __future__ import annotations

import runpy
import unittest
from unittest.mock import patch
from pathlib import Path

from ai_agent.cli.index_from_exports import parse_args


class CliArgTests(unittest.TestCase):
    def test_index_from_exports_parse_args_uses_expected_defaults(self) -> None:
        with patch("sys.argv", ["index_from_exports.py"]):
            args = parse_args()

        self.assertEqual(args.chunk_files, ["ticket_cases.jsonl.gz", "article_chunks.jsonl.gz"])
        self.assertEqual(args.embed_batch_size, 4)
        self.assertEqual(args.write_batch_size, 32)
        self.assertFalse(args.hide_progress)

    def test_research_wrapper_invokes_ai_agent_index_exports(self) -> None:
        repo_root = Path(__file__).resolve().parents[2]
        script_path = repo_root / "research" / "run_ai_agent_index.py"

        with patch("sys.argv", [str(script_path), "--hide-progress"]), patch("subprocess.run") as run_mock:
            runpy.run_path(str(script_path), run_name="__main__")

        run_mock.assert_called_once()
        command = run_mock.call_args.args[0]
        self.assertEqual(
            command[:4],
            ["uv", "run", "--project", str(repo_root / "ai-agent")],
        )
        self.assertEqual(command[4], "ai-agent-index-exports")
        self.assertIn("--hide-progress", command)

    def test_research_wrapper_invokes_collection_rebuild_command(self) -> None:
        repo_root = Path(__file__).resolve().parents[2]
        script_path = repo_root / "research" / "rebuild_qdrant_index.py"

        with patch("sys.argv", [str(script_path), "--vector-size", "1024"]), patch("subprocess.run") as run_mock:
            runpy.run_path(str(script_path), run_name="__main__")

        run_mock.assert_called_once()
        command = run_mock.call_args.args[0]
        self.assertEqual(
            command[:4],
            ["uv", "run", "--project", str(repo_root / "ai-agent")],
        )
        self.assertEqual(command[4], "ai-agent-rebuild-collections")
        self.assertEqual(command[-2:], ["--vector-size", "1024"])


if __name__ == "__main__":
    unittest.main()
