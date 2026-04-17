from __future__ import annotations

import json
import sys
from pathlib import Path

from backend.app import create_app

DEFAULT_OUTPUT_PATH = Path(__file__).resolve().parents[1] / "frontend" / "public" / "openapi.json"


def build_openapi_schema() -> dict[str, object]:
    app = create_app(initialize_runtime=False)
    return app.openapi()


def write_openapi_schema(output_path: Path) -> Path:
    schema = build_openapi_schema()
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(
        json.dumps(schema, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    return output_path


def main() -> None:
    output_path = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_OUTPUT_PATH
    resolved_path = write_openapi_schema(output_path)
    print(resolved_path)


if __name__ == "__main__":
    main()
