from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
import os

from database import engine
import models
from routers import auth, progress

load_dotenv()

# Tạo bảng nếu chưa có
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="漢字牌 API",
    description="Backend cho game ghép chữ Hán",
    version="1.0.0",
)

# CORS — cho phép frontend gọi API
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5500")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL, "http://127.0.0.1:5500"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Đăng ký routers
app.include_router(auth.router)
app.include_router(progress.router)


@app.get("/")
def root():
    return {"message": "漢字牌 API đang chạy", "docs": "/docs"}


@app.get("/health")
def health():
    return {"status": "ok"}
