from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from routers import auth, media, radarr, sonarr
from schemas.response import ApiResponse

app = FastAPI(
    title="Dasharr API Backend",
    version="0.1.0",
    description="Backend FastAPI minimal et sécurisé avec JWT pour Dasharr",
)

# CORS pour autoriser le frontend Vite
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Handler global pour que TOUTES les erreurs HTTP soient au format ApiResponse
@app.exception_handler(HTTPException)
async def custom_http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content=ApiResponse(
            success=False,
            message=str(exc.detail),
            data=None,
        ).model_dump(),
    )


# Enregistrement des routers
app.include_router(auth.router)
app.include_router(radarr.router)
app.include_router(sonarr.router)
app.include_router(media.router)


@app.get("/health", response_model=ApiResponse)
@app.get("/", response_model=ApiResponse)
async def health_check():
    return ApiResponse(
        success=True,
        message="Service operationnel",
        data={"status": "ok"},
    )
