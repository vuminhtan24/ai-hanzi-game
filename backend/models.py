from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "users"
    id            = Column(Integer, primary_key=True, index=True)
    username      = Column(String(50), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    created_at    = Column(DateTime, server_default=func.now())
    progress      = relationship("Progress", back_populates="user", uselist=False)

class Progress(Base):
    __tablename__ = "progress"
    id            = Column(Integer, primary_key=True, index=True)
    user_id       = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    current_level = Column(Integer, default=1)
    max_level     = Column(Integer, default=1)
    total_score   = Column(Integer, default=0)
    updated_at    = Column(DateTime, server_default=func.now(), onupdate=func.now())
    user          = relationship("User", back_populates="progress")