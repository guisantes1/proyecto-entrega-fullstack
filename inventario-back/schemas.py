from pydantic import BaseModel
from datetime import datetime
from typing import Optional


# -------------------------
# ITEM
# -------------------------

# Clase base para Item con campos comunes
class ItemBase(BaseModel):
    sku: str  # Código SKU del producto
    ean13: str  # Código EAN13 del producto

# Modelo para crear un nuevo item, incluye cantidad inicial
class ItemCreate(ItemBase):
    quantity: int  # Cantidad inicial del producto

# Modelo para actualizar un item, solo la cantidad
class ItemUpdate(BaseModel):
    quantity: int  # Nueva cantidad para actualizar

# Modelo para salida (response) de un item con todos los campos y orm_mode
class ItemOut(ItemBase):
    id: int  # ID interno del producto
    quantity: int  # Cantidad actual del producto

    class Config:
        orm_mode = True  # Permite usar objetos ORM directamente

# -------------------------
# MOVEMENT
# -------------------------

# Clase base para movimientos con tipo y cantidad
class MovementBase(BaseModel):
    type: str  # Tipo de movimiento: 'entrada', 'salida' o 'ajuste'
    amount: int  # Cantidad de unidades movidas (puede ser positiva o negativa)

# Modelo para crear un movimiento, añade id de item y usuario opcional
class MovementCreate(MovementBase):
    item_id: int  # ID del producto afectado
    username: Optional[str] = None  # Nombre del usuario que realiza el movimiento (opcional)

# Modelo para respuesta de movimiento con todos los datos
class MovementOut(BaseModel):
    id: int  # ID del movimiento
    item_id: int  # ID del producto afectado
    type: str  # Tipo de movimiento
    amount: int  # Cantidad movida
    timestamp: datetime  # Fecha y hora del movimiento
    username: Optional[str] = None  # Usuario que realizó el movimiento (opcional)
    quantity_before: int  # Cantidad antes del movimiento
    quantity_after: int  # Cantidad después del movimiento

    class Config:
        orm_mode = True  # Permite uso directo con objetos ORM

# -------------------------
# USERS
# -------------------------

# Modelo para crear un usuario nuevo con nombre y contraseña
class UserCreate(BaseModel):
    username: str  # Nombre de usuario
    password: str  # Contraseña en texto plano para crear usuario

# Modelo para salida (response) de usuario sin contraseña
class UserOut(BaseModel):
    id: int  # ID del usuario
    username: str  # Nombre de usuario

    class Config:
        from_attributes = True  # En Pydantic v2, reemplaza orm_mode

# Modelo para cambio de contraseña
class ChangePassword(BaseModel):
    old_password: str  # Contraseña actual para validar
    new_password: str  # Nueva contraseña que se quiere establecer
