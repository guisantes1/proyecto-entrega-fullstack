from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Integer
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base
from schemas import ItemOut

from security import pwd_context

# Modelo para la tabla "items"
class Item(Base):
    __tablename__ = "items"  # Nombre tabla en la base de datos

    id = Column(Integer, primary_key=True, index=True)  # PK autoincremental
    sku = Column(String, unique=True, index=True, nullable=False)  # SKU único obligatorio
    ean13 = Column(String, unique=True, index=True, nullable=False)  # EAN13 único obligatorio
    quantity = Column(Integer, default=0)  # Cantidad disponible, valor por defecto 0

    movements = relationship("Movement", back_populates="item")  
    # Relación uno a muchos con movimientos (movements)

# Modelo para la tabla "movements" (movimientos/entradas/salidas de inventario)
class Movement(Base):
    __tablename__ = 'movements'  # Nombre tabla movimientos

    id = Column(Integer, primary_key=True, index=True)  # PK autoincremental
    item_id = Column(Integer, ForeignKey('items.id'))  # FK hacia items.id
    type = Column(String)  # Tipo de movimiento: 'entrada', 'salida', 'ajuste', 'creación' etc.
    amount = Column(Integer)  # Cantidad de unidades movidas (positiva o negativa)
    timestamp = Column(DateTime, default=datetime.utcnow)  # Fecha y hora del movimiento (UTC por defecto)
    username = Column(String, nullable=True)  # Usuario que realizó el movimiento (puede ser nulo)
    quantity_before = Column(Integer)  # Cantidad antes del movimiento
    quantity_after = Column(Integer)   # Cantidad después del movimiento

    item = relationship("Item", back_populates="movements")  
    # Relación inversa con item

# Modelo para la tabla "users"
class User(Base):
    __tablename__ = "users"  # Nombre tabla usuarios

    id = Column(Integer, primary_key=True, index=True)  # PK autoincremental
    username = Column(String, unique=True, index=True)  # Nombre de usuario único e indexado
    hashed_password = Column(String)  # Contraseña hasheada para seguridad

    # Método para verificar contraseña con la contraseña hasheada almacenada
    def verify_password(self, password: str):
        return pwd_context.verify(password, self.hashed_password)
