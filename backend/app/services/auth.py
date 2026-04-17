from __future__ import annotations

import hashlib
import hmac
import os
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import HTTPException, status

from backend.app.config import Settings
from backend.app.db.models.entities import User
from backend.app.db.repositories.admin import AdminRepository


class AuthService:
    def __init__(self, repository: AdminRepository, settings: Settings) -> None:
        self.repository = repository
        self.settings = settings

    @staticmethod
    def hash_password(password: str) -> str:
        salt = os.urandom(16)
        derived_key = hashlib.scrypt(
            password.encode("utf-8"),
            salt=salt,
            n=2**14,
            r=8,
            p=1,
        )
        return f"{salt.hex()}:{derived_key.hex()}"

    @staticmethod
    def verify_password(password: str, password_hash: str) -> bool:
        salt_hex, hash_hex = password_hash.split(":", maxsplit=1)
        derived_key = hashlib.scrypt(
            password.encode("utf-8"),
            salt=bytes.fromhex(salt_hex),
            n=2**14,
            r=8,
            p=1,
        )
        return hmac.compare_digest(derived_key.hex(), hash_hex)

    async def login(self, email: str, password: str) -> str:
        user = await self.repository.get_user_by_email(email)
        if user is None or not self.verify_password(password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password.",
            )
        return self.create_access_token(user)

    def create_access_token(self, user: User) -> str:
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=self.settings.jwt_expire_minutes)
        payload = {
            "sub": user.id,
            "login": user.login,
            "exp": expires_at,
        }
        return jwt.encode(payload, self.settings.jwt_secret, algorithm=self.settings.jwt_algorithm)

    async def get_current_admin(self, token: str) -> User:
        try:
            payload = jwt.decode(
                token,
                self.settings.jwt_secret,
                algorithms=[self.settings.jwt_algorithm],
            )
        except jwt.PyJWTError as error:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Not authenticated.",
            ) from error

        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Not authenticated.",
            )

        user = await self.repository.get_user_by_id(user_id)
        if user is None or not user.is_admin:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Not authenticated.",
            )
        return user
