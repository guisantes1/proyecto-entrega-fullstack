from pydantic import BaseModel
from datetime import datetime
from typing import Optional


# ---------- ITEM ----------

class ItemBase(BaseModel):
    sku: str
    ean13: str

class ItemCreate(ItemBase):
    quantity: int

class ItemUpdate(BaseModel):
    quantity: int

class ItemOut(ItemBase):
    id: int
    quantity: int

    class Config:
        orm_mode = True


# ---------- MOVEMENT ----------

class MovementBase(BaseModel):
    type: str  # 'entrada' o 'salida' o 'ajuste'
    amount: int

class MovementCreate(MovementBase):
    item_id: int
    username: Optional[str] = None  # nuevo campo opcional

class MovementOut(BaseModel):
    id: int
    item_id: int
    type: str
    amount: int
    timestamp: datetime
    username: Optional[str] = None
    quantity_before: int
    quantity_after: int

    class Config:
        orm_mode = True

# ---------- USERS ----------

from pydantic import BaseModel

class UserCreate(BaseModel):
    username: str
    password: str

class UserOut(BaseModel):
    id: int
    username: str

    class Config:
        from_attributes = True  

