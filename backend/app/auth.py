import os
from datetime import datetime, timedelta, timezone
from typing import Optional

from jose import JWTError, jwt
from passlib.context import CryptContext

# Secret key and algorithm – set SECRET_KEY env var in production
SECRET_KEY = os.getenv("SECRET_KEY", "super-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_SECONDS = 300
REFRESH_TOKEN_EXPIRE_SECONDS = 3600

# Valid credentials – override via environment variables in production
VALID_USERNAME = os.getenv("APP_USERNAME", "admin")
VALID_PASSWORD = os.getenv("APP_PASSWORD", "admin123")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Hash computed once at startup
_VALID_PASSWORD_HASH = pwd_context.hash(VALID_PASSWORD)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def authenticate_user(username: str, password: str) -> bool:
    if username != VALID_USERNAME:
        return False
    return verify_password(password, _VALID_PASSWORD_HASH)


def create_token(data: dict, expires_delta: timedelta) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + expires_delta
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def create_access_token(username: str) -> str:
    return create_token(
        {"sub": username, "type": "access"},
        timedelta(seconds=ACCESS_TOKEN_EXPIRE_SECONDS),
    )


def create_refresh_token(username: str) -> str:
    return create_token(
        {"sub": username, "type": "refresh"},
        timedelta(seconds=REFRESH_TOKEN_EXPIRE_SECONDS),
    )


def decode_refresh_token(token: str) -> Optional[str]:
    """Decode a refresh token and return the username, or None if invalid."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "refresh":
            return None
        return payload.get("sub")
    except JWTError:
        return None
