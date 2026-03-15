from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import datetime

class RegisterRequest(BaseModel):
    username: str
    password: str

    @field_validator("username")
    @classmethod
    def username_valid(cls, v):
        v = v.strip()
        if len(v) < 3: raise ValueError("Tên đăng nhập tối thiểu 3 ký tự")
        if len(v) > 50: raise ValueError("Tên đăng nhập tối đa 50 ký tự")
        return v

    @field_validator("password")
    @classmethod
    def password_valid(cls, v):
        if len(v) < 6: raise ValueError("Mật khẩu tối thiểu 6 ký tự")
        return v

class LoginRequest(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type:   str = "bearer"
    username:     str

class ProgressResponse(BaseModel):
    current_level: int
    max_level:     int
    total_score:   int
    updated_at:    Optional[datetime] = None
    class Config:
        from_attributes = True

class CompleteRequest(BaseModel):
    level: int
    score: int

class CompleteResponse(BaseModel):
    message:     str
    new_level:   int
    total_score: int
    level_up:    bool