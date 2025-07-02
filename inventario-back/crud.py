from sqlalchemy.orm import Session
from models import Item, Movement
from schemas import ItemOut, ItemCreate, ItemUpdate, MovementOut, MovementCreate, UserCreate
from datetime import datetime
from models import User
from security import pwd_context


import pytz

madrid_tz = pytz.timezone('Europe/Madrid')

# Obtener todos los productos
def get_items(db: Session):
    return db.query(Item).all()


def update_item_quantity(db: Session, item_id: int, item_data: ItemUpdate, user: str = None):
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        return None

    cantidad_anterior = item.quantity
    cantidad_nueva = item_data.quantity
    diferencia = cantidad_nueva - cantidad_anterior

    item.quantity = cantidad_nueva
    db.add(item)

    movimiento = Movement(
        item_id=item_id,
        type="ajuste",
        amount=diferencia,
        timestamp=datetime.now(pytz.timezone("Europe/Madrid")),
        username=user, 
        quantity_before=cantidad_anterior,
        quantity_after=cantidad_nueva
    )
    db.add(movimiento)
    db.commit()
    db.refresh(item)
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



def get_user_by_username(db, username: str):
    return db.query(User).filter(User.username == username).first()

def create_user(db, user_data):
    hashed_pw = pwd_context.hash(user_data.password)
    user = User(username=user_data.username, hashed_password=hashed_pw)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def reset_database(db: Session):
    print("Resetting database...")  # <- Añade esto

    db.query(Movement).delete()
    db.query(Item).delete()
    db.query(User).delete()
    db.commit()

    usuarios_iniciales = ["admin", "guillem", "divain"]
    for nombre in usuarios_iniciales:
        create_user(db, UserCreate(username=nombre, password="1234"))

    items = [
        Item(sku="SKU123", ean13="1234567890123", quantity=15),
        Item(sku="SKU456", ean13="9876543210987", quantity=5),
        Item(sku="SKU789", ean13="4567890123456", quantity=0),
    ]
    db.add_all(items)
    db.commit()

    ahora = datetime.now(pytz.timezone("Europe/Madrid"))
    for item in items:
        movimiento = Movement(
            item_id=item.id,
            type="creación",
            amount=item.quantity,
            timestamp=ahora,
            username="sistema",
            quantity_before=0,
            quantity_after=item.quantity
        )
        db.add(movimiento)

    db.commit()
    print("Database reset complete")  # <- Añade esto
    

def change_user_password(db: Session, user: User, old_password: str, new_password: str):
    print(f"Intentando cambiar contraseña de: {user.username}")

    # Recuperar user desde la sesión
    user_in_db = db.query(User).filter(User.id == user.id).first()

    if not pwd_context.verify(old_password, user_in_db.hashed_password):
        return False, "Contraseña actual incorrecta"

    user_in_db.hashed_password = pwd_context.hash(new_password)
    db.commit()
    print("✅ Contraseña cambiada en DB")
    return True, "Contraseña actualizada correctamente"
