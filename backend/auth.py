from datetime import UTC, datetime, timedelta

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from config import JWT_ALGORITHM, JWT_EXPIRATION_MINUTES, JWT_SECRET

security = HTTPBearer()


def create_access_token(
    data: dict,
    expires_delta: timedelta = timedelta(minutes=int(JWT_EXPIRATION_MINUTES)),
) -> str:
    """Génère un token JWT signé avec une date d'expiration."""
    to_encode = data.copy()
    expire = datetime.now(UTC) + expires_delta
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)


def verify_jwt_token(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    """Vérifie et décode le token JWT envoyé dans l'en-tête Authorization: Bearer <token>."""
    token = credentials.credentials
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token JWT expiré",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token JWT invalide",
            headers={"WWW-Authenticate": "Bearer"},
        )
