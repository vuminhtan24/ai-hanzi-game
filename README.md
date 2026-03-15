# 漢字牌 · Hán Tự Bài

Game ghép chữ Hán — HTML/JS + FastAPI + MySQL

---

## Cấu trúc project

```
hanzi-game/
├── backend/          ← FastAPI server
│   ├── main.py
│   ├── database.py
│   ├── models.py
│   ├── schemas.py
│   ├── auth_utils.py
│   ├── routers/
│   │   ├── auth.py
│   │   └── progress.py
│   ├── data/
│   │   ├── level1.json
│   │   ├── level2.json
│   │   └── level3.json
│   ├── requirements.txt
│   └── .env.example
│
└── frontend/
    ├── index.html    ← Trang login/register
    ├── game.html     ← Trang chơi game
    ├── js/
    │   ├── api.js    ← Fetch wrapper + JWT
    │   ├── game.js   ← Logic game
    │   └── ui.js     ← DOM controller
    └── assets/
        └── cards/    ← Ảnh bài (中.png, 文.png, ...)
```

---

## Cài đặt Backend

### 1. Tạo database MySQL

```sql
CREATE DATABASE hanzi_game CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. Cài dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 3. Cấu hình .env

```bash
cp .env.example .env
# Mở .env và điền thông tin MySQL + đổi SECRET_KEY
```

### 4. Chạy server

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Truy cập docs tại: http://localhost:8000/docs

---

## Cài đặt Frontend

### 1. Copy ảnh bài vào đúng thư mục

```
frontend/assets/cards/你.png
frontend/assets/cards/好.png
frontend/assets/cards/人.png
... (tên file = chữ Hán)
```

### 2. Chạy với Live Server (VSCode) hoặc bất kỳ HTTP server nào

```bash
# Python HTTP server
cd frontend
python -m http.server 5500

# Hoặc dùng VSCode extension "Live Server"
```

Truy cập: http://localhost:5500

---

## Thêm level mới

Tạo file `backend/data/level4.json` theo format:

```json
{
  "level": 4,
  "name": "Tên level",
  "description": "Mô tả",
  "chars": ["字","1", "字2", ...],
  "words": [
    { "word": "词语", "meaning": "Nghĩa tiếng Việt", "chars": ["词","语"] }
  ]
}
```

Cập nhật `MAX_LEVEL = 10` trong `routers/progress.py` nếu cần.

---

## API Endpoints

| Method | URL | Mô tả |
|--------|-----|-------|
| POST | /api/auth/register | Đăng ký |
| POST | /api/auth/login | Đăng nhập → JWT |
| GET | /api/progress | Lấy tiến độ người chơi |
| POST | /api/progress/complete | Hoàn thành level |
| GET | /api/words/{level} | Lấy từ điển level N |

Tất cả ngoài auth đều cần header:
```
Authorization: Bearer <token>
```

---

## Lưu ý

- **Tên file ảnh** phải là chữ Hán Unicode, ví dụ `中.png` (không phải `zhong.png`)
- **Windows**: Đảm bảo file system hỗ trợ Unicode filename
- **SECRET_KEY** trong `.env` phải đổi trước khi deploy production
- **CORS**: Đổi `FRONTEND_URL` trong `.env` cho khớp với domain thật


## Cach Run
- Cửa sổ 1 — Backend:
powershell
cd D:\Ky7\EXE101\files\backend
python -m uvicorn main:app --reload

- Cửa sổ 2 — Frontend:
powershell
cd D:\Ky7\EXE101\files\frontend
python -m http.server 5500
```

Sau đó mở trình duyệt vào:
```
http://localhost:5500/index.html