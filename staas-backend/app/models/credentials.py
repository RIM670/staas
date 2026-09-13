from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from app.core.database import Base
from datetime import datetime

class CredentialsS3(Base):
    __tablename__ = "credentials_s3"
    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=False)
    uid_ceph = Column(String, nullable=False)
    access_key = Column(String, nullable=False)
    secret_key = Column(String, nullable=False)
    date_creation = Column(DateTime, default=datetime.utcnow)