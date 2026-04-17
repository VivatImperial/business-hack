import unittest
from unittest.mock import patch

from research.embed_chunks import parse_args


class EmbedChunksArgTests(unittest.TestCase):
    def test_parse_args_uses_small_default_batch_size(self):
        with patch("sys.argv", ["embed_chunks.py"]):
            args = parse_args()

        self.assertEqual(args.embed_batch_size, 4)
        self.assertEqual(
            args.chunk_files,
            ["ticket_cases.jsonl.gz", "article_chunks.jsonl.gz"],
        )
        self.assertFalse(args.hide_progress)


if __name__ == "__main__":
    unittest.main()

