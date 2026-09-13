from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.core.database import Base
from datetime import datetime

class OtpCode(Base):
    __tablename__ = "otp_codes"
    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=False)
    code = Column(String(6), nullable=False)
    expire_at = Column(DateTime, nullable=False)
    utilise = Column(Boolean, default=False)
    date_creation = Column(DateTime, default=datetime.utcnow)