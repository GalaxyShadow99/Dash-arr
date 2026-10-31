from fastapi import APIRouter, HTTPException, status

from auth import create_access_token  # ty: ignore[unresolved-import]
from config import ADMIN_EMAIL, ADMIN_PASSWORD
from schemas.auth import LoginRequest
from schemas.response import ApiResponse

router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"],
)


@router.post("/login", response_model=ApiResponse)
def login(credentials: LoginRequest):
    """Authentifie l'utilisateur via email et mot de passe, et renvoie ApiResponse avec JWT."""
    if credentials.email != ADMIN_EMAIL or credentials.password != ADMIN_PASSWORD:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou mot de passe incorrect",
        )

    token = create_access_token(data={"sub": credentials.email})  # type: ignore
    return ApiResponse(
        success=True,
        message="Connexion réussie",
        data={
            "access_token": token,
            "token_type": "bearer",
            "email": credentials.email,
        },
    )
