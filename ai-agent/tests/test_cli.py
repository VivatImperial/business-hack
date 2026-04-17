from __future__ import annotations

import unittest
from unittest.mock import patch

from ai_agent.cli.index_from_exports import parse_args


class CliArgTests(unittest.TestCase):
    def test_index_from_exports_parse_args_uses_expected_defaults(self) -> None:
        with patch("sys.argv", ["index_from_exports.py"]):
            args = parse_args()

        self.assertEqual(args.chunk_files, ["ticket_cases.jsonl.gz", "article_chunks.jsonl.gz"])
        self.assertEqual(args.embed_batch_size, 4)
        self.assertEqual(args.write_batch_size, 32)
        self.assertFalse(args.hide_progress)


if __name__ == "__main__":
    unittest.main()
