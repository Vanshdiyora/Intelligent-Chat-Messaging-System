from pydantic_settings import BaseSettings
from pathlib import Path
import os


class Settings(BaseSettings):
    APP_NAME: str = "Intelligent Chat Messaging System"
    DEBUG: bool = True

    # Database
    DATABASE_URL: str = "sqlite:///./chat.db"

    # JWT
    SECRET_KEY: str = "dev-secret-key-not-for-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    # CORS
    FRONTEND_URL: str = "http://localhost:5173"

    # AI Models
    MODEL_DIR: str = str(Path(__file__).resolve().parent.parent.parent.parent / "ai" / "saved_models")

    class Config:
        env_file = os.path.join(Path(__file__).resolve().parent.parent.parent.parent, ".env")


settings = Settings()
