from __future__ import annotations

from pathlib import Path
import re
from uuid import uuid4


SAFE_FILE_RE = re.compile(r"[^A-Za-z0-9._-]+")
EXTENSION_BY_MIME = {
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/webp": ".webp",
}


class UploadStorageService:
    def __init__(self, *, uploads_dir: str) -> None:
        self.root = Path(uploads_dir).resolve()
        self.root.mkdir(parents=True, exist_ok=True)

    def save_ocr_image(
        self,
        *,
        file_bytes: bytes,
        mime_type: str,
        file_name: str | None,
    ) -> tuple[str, str, str]:
        safe_name = self._safe_name(file_name, mime_type=mime_type)
        key = f"ocr/{uuid4().hex}--{safe_name}"
        path = self.root / key
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(file_bytes)
        return key, f"/uploads/{key}", safe_name

    def resolve_upload(self, upload_key: str | None) -> tuple[str, str] | None:
        if not upload_key:
            return None
        path = (self.root / upload_key).resolve()
        try:
            path.relative_to(self.root)
        except ValueError:
            return None
        if not path.is_file():
            return None
        return f"/uploads/{upload_key}", self._display_name(upload_key)

    def _safe_name(self, file_name: str | None, *, mime_type: str) -> str:
        extension = EXTENSION_BY_MIME.get(mime_type, ".bin")
        raw_name = (file_name or "").strip()
        stem = Path(raw_name).stem if raw_name else "ocr-image"
        safe_stem = SAFE_FILE_RE.sub("-", stem).strip("-._") or "ocr-image"
        return f"{safe_stem}{extension}"

    def _display_name(self, upload_key: str) -> str:
        tail = Path(upload_key).name
        _, _, suffix = tail.partition("--")
        return suffix or tail
