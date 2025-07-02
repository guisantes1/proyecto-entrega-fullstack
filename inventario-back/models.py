from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Integer
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base
from schemas import ItemOut

from security import pwd_context

class Item(Base):
    __tablename__ = "items"

    id = Column(Integer, primary_key=True, index=True)
    sku = Column(String, unique=True, index=True, nullable=False)
    ean13 = Column(String, unique=True, index=True, nullable=False)
    quantity = Column(Integer, default=0)

    movements = relationship("Movement", back_populates="item")


class Movement(Base):
    __tablename__ = 'movements'
    id = Column(Integer, primary_key=True, index=True)
    item_id = Column(Integer, ForeignKey('items.id'))
    type = Column(String)
    amount = Column(Integer)
    timestamp = Column(DateTime, default=datetime.utcnow)
    username = Column(String, nullable=True)  # Renombrado desde user
    quantity_before = Column(Integer)  # Existencias antes
    quantity_after = Column(Integer)   # Existencias después

    item = relationship("Item", back_populates="movements")

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)

    def verify_password(self, password: str):
        return pwd_context.verify(password, self.hashed_password)

