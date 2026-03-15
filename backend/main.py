from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

from database import engine
import models
from routers import auth, progress

# Load biến môi trường
load_dotenv()

# Tạo bảng database nếu chưa có
models.Base.metadata.create_all(bind=engine)

# Khởi tạo app
app = FastAPI(
    title="漢字牌 API",
    description="Backend cho game ghép chữ Hán",
    version="1.0.0",
)

# Danh sách domain được phép gọi API
origins = [
    "https://hanzi-game.onrender.com",  # frontend deploy
    "http://localhost:5500",            # dev local
    "http://127.0.0.1:5500"
]

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router)
app.include_router(progress.router)

# Root
@app.get("/")
def root():
    return {
        "message": "漢字牌 API đang chạy",
        "docs": "/docs"
    }

# Health check
@app.get("/health")
def health():
    return {"status": "ok"}