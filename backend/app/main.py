from fastapi import FastAPI, HTTPException, status

from .auth import authenticate_user, create_access_token, create_refresh_token, decode_refresh_token
from .models import LoginRequest, RefreshRequest, TokenResponse

app = FastAPI(title="JWT Backend API", version="0.1.0")


@app.post("/auth/token", response_model=TokenResponse, status_code=status.HTTP_200_OK)
def login(request: LoginRequest):
    """Authenticate with username and password; returns access and refresh tokens."""
    if not authenticate_user(request.username, request.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )
    return TokenResponse(
        access_token=create_access_token(request.username),
        refresh_token=create_refresh_token(request.username),
    )


@app.post("/auth/refresh", response_model=TokenResponse, status_code=status.HTTP_200_OK)
def refresh(request: RefreshRequest):
    """Exchange a valid refresh token for a new pair of access and refresh tokens."""
    username = decode_refresh_token(request.refresh_token)
    if username is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )
    return TokenResponse(
        access_token=create_access_token(username),
        refresh_token=create_refresh_token(username),
    )
