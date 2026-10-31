from pydantic import BaseModel


class MovieImage(BaseModel):
    coverType: str | None = None
    url: str | None = None
    remoteUrl: str | None = None


class MovieResponse(BaseModel):
    id: int | None = None
    title: str
    year: int | None = None
    overview: str | None = None
    monitored: bool | None = None
    isAvailable: bool | None = None
    imdbId: str | None = None
    images: list[MovieImage] | None = None

    class Config:
        extra = "ignore"
