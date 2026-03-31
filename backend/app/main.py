import sys
from pathlib import Path

# Add project root to Python path so 'ai' module can be imported
PROJECT_ROOT = str(Path(__file__).resolve().parent.parent.parent)
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text
from app.core.config import settings
from app.db.session import engine, Base
from app.api.auth.routes import router as auth_router
from app.api.chat.routes import router as chat_router
from app.api.ai.routes import router as ai_router
from app.websockets.chat_ws import router as ws_router

# Import all models so Base.metadata knows about them
import app.models  # noqa: F401

# Create database tables
Base.metadata.create_all(bind=engine)

# Auto-migrate: add missing columns
with engine.connect() as conn:
    inspector = inspect(engine)
    columns = [col["name"] for col in inspector.get_columns("conversation_participants")]
    if "unread_count" not in columns:
        conn.execute(text("ALTER TABLE conversation_participants ADD COLUMN unread_count INTEGER DEFAULT 0"))
        conn.commit()

app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth_router)
app.include_router(chat_router)
app.include_router(ai_router)
app.include_router(ws_router)


@app.get("/")
def health_check():
    return {"status": "ok", "app": settings.APP_NAME}
