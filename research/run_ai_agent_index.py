#!/usr/bin/env python3

from __future__ import annotations

import subprocess
import sys
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]
AI_AGENT_DIR = REPO_ROOT / "ai-agent"


def main() -> None:
    command = ["uv", "run", "--project", str(AI_AGENT_DIR), "ai-agent-index-exports", *sys.argv[1:]]
    subprocess.run(command, cwd=REPO_ROOT, check=True)


if __name__ == "__main__":
    main()
