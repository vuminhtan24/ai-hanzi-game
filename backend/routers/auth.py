from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
import models
import schemas
from auth_utils import hash_password, verify_password, create_access_token

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=schemas.TokenResponse, status_code=201)
def register(body: schemas.RegisterRequest, db: Session = Depends(get_db)):
    # Kiểm tra username đã tồn tại chưa
    existing = db.query(models.User).filter(
        models.User.username == body.username
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Tên đăng nhập đã được sử dụng",
        )

    # Tạo user mới
    user = models.User(
        username=body.username,
        password_hash=hash_password(body.password),
    )
    db.add(user)
    db.flush()   # lấy user.id trước khi commit

    # Tạo progress mặc định
    progress = models.Progress(user_id=user.id)
    db.add(progress)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": user.username})
    return schemas.TokenResponse(access_token=token, username=user.username)


@router.post("/login", response_model=schemas.TokenResponse)
def login(body: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(
        models.User.username == body.username
    ).first()

    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Tên đăng nhập hoặc mật khẩu không đúng",
        )

    token = create_access_token({"sub": user.username})
    return schemas.TokenResponse(access_token=token, username=user.username)
