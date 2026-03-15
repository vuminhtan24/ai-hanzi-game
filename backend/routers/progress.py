from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import json, os

from database import get_db
import models
import schemas
from auth_utils import get_current_user

router = APIRouter(prefix="/api", tags=["game"])

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")
MAX_LEVEL = 10  # tổng số level hiện có


# ── Lấy tiến độ ──────────────────────────────

@router.get("/progress", response_model=schemas.ProgressResponse)
def get_progress(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    progress = db.query(models.Progress).filter(
        models.Progress.user_id == current_user.id
    ).first()

    if not progress:
        # Tạo mới nếu chưa có (trường hợp edge)
        progress = models.Progress(user_id=current_user.id)
        db.add(progress)
        db.commit()
        db.refresh(progress)

    return progress


# ── Hoàn thành ván → cập nhật progress ───────

@router.post("/progress/complete", response_model=schemas.CompleteResponse)
def complete_level(
    body: schemas.CompleteRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    progress = db.query(models.Progress).filter(
        models.Progress.user_id == current_user.id
    ).first()

    if not progress:
        raise HTTPException(status_code=404, detail="Không tìm thấy tiến độ")

    # Chỉ chấp nhận level hợp lệ (không skip level)
    if body.level != progress.current_level:
        raise HTTPException(
            status_code=400,
            detail=f"Level không hợp lệ. Bạn đang ở level {progress.current_level}",
        )

    level_up = False
    next_level = progress.current_level

    # Nếu chưa đến max level → mở level tiếp theo
    if progress.current_level < MAX_LEVEL:
        next_level = progress.current_level + 1
        level_up = True
        progress.current_level = next_level
        if next_level > progress.max_level:
            progress.max_level = next_level

    progress.total_score += body.score
    db.commit()
    db.refresh(progress)

    return schemas.CompleteResponse(
        message="Hoàn thành!" if not level_up else f"Lên level {next_level}!",
        new_level=next_level,
        total_score=progress.total_score,
        level_up=level_up,
    )


# ── Lấy từ điển theo level ────────────────────

@router.get("/words/{level}")
def get_words(
    level: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Kiểm tra quyền truy cập level
    progress = db.query(models.Progress).filter(
        models.Progress.user_id == current_user.id
    ).first()

    if not progress or level > progress.max_level:
        raise HTTPException(
            status_code=403,
            detail=f"Bạn chưa mở khóa level {level}",
        )

    file_path = os.path.join(DATA_DIR, f"level{level}.json")
    if not os.path.exists(file_path):
        raise HTTPException(
            status_code=404,
            detail=f"Không tìm thấy dữ liệu level {level}",
        )

    with open(file_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    return data
