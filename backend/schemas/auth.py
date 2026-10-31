from pydantic import BaseModel, EmailStr


class LoginRequest(BaseModel):
    """Schéma de la requête de connexion."""

    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    """Schéma de réponse avec le token JWT."""

    access_token: str
    token_type: str = "bearer"
    email: str


class TokenPayload(BaseModel):
    """Schéma du contenu décodé du token JWT."""

    sub: str
    exp: int
