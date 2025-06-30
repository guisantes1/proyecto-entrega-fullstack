from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base
from schemas import ItemOut


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
