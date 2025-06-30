from sqlalchemy.orm import Session
from models import Item, Movement
from schemas import ItemUpdate, MovementCreate, ItemCreate
from datetime import datetime

import pytz

madrid_tz = pytz.timezone('Europe/Madrid')

# Obtener todos los productos
def get_items(db: Session):
    return db.query(Item).all()


def update_item_quantity(db: Session, item_id: int, item_update: ItemUpdate, user: str = None):
    item = db.query(Item).filter(Item.id == item_id).first()
    if item is None:
        return None
    
    quantity_before = item.quantity
    quantity_after = item_update.quantity

    # Actualizar cantidad
    item.quantity = quantity_after
    db.commit()
    db.refresh(item)

    # Crear movimiento de tipo "ajuste" o similar
    movement = Movement(
        item_id=item_id,
        type="ajuste",
        amount=quantity_after - quantity_before,
        timestamp=datetime.now(madrid_tz),  # hora Madrid
        username=user,  # Cambiado de user a username
        quantity_before=quantity_before,
        quantity_after=quantity_after
    )
    db.add(movement)
    db.commit()
    db.refresh(movement)

    return item


# Crear un nuevo movimiento
def create_movement(db: Session, movement_data: MovementCreate):
    item = db.query(Item).filter(Item.id == movement_data.item_id).first()
    if not item:
        return None

    quantity_before = item.quantity

    # Actualizar cantidad según tipo
    if movement_data.type == "entrada":
        item.quantity += movement_data.amount
    elif movement_data.type == "salida":
        item.quantity -= movement_data.amount

    quantity_after = item.quantity

    movement = Movement(
        item_id=movement_data.item_id,
        type=movement_data.type,
        amount=movement_data.amount,
        timestamp=datetime.now(madrid_tz),  # hora Madrid
        username=getattr(movement_data, "username", None),
        quantity_before=quantity_before,
        quantity_after=quantity_after,
    )

    db.add(movement)
    db.commit()
    db.refresh(movement)
    return movement



# Obtener historial de movimientos
def get_movements(db: Session):
    return db.query(Movement).order_by(Movement.timestamp.desc()).all()

def create_item(db: Session, item_data: ItemCreate):
    if db.query(Item).filter(Item.sku == item_data.sku).first():
        return None, "SKU ya existe"
    if db.query(Item).filter(Item.ean13 == item_data.ean13).first():
        return None, "EAN13 ya existe"

    nuevo_item = Item(sku=item_data.sku, ean13=item_data.ean13, quantity=item_data.quantity)
    db.add(nuevo_item)
    db.commit()
    db.refresh(nuevo_item)

    # Crear movimiento de creación/ajuste
    movimiento = Movement(
        item_id=nuevo_item.id,
        type="creación",
        amount=nuevo_item.quantity,
        timestamp=datetime.now(madrid_tz),  # hora Madrid
        quantity_before=0,
        quantity_after=nuevo_item.quantity
    )
    db.add(movimiento)
    db.commit()

    return nuevo_item, None
