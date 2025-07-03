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
    return db.query(Item).all()  # Devuelve todos los items en la tabla


# Actualizar cantidad de un item e insertar movimiento relacionado
def update_item_quantity(db: Session, item_id: int, item_data: ItemUpdate, user: str = None):
    item = db.query(Item).filter(Item.id == item_id).first()  # Buscar item por id
    if not item:
        return None  # Si no existe, devolver None

    cantidad_anterior = item.quantity  # Cantidad antes de actualizar
    cantidad_nueva = item_data.quantity  # Cantidad nueva desde el payload
    diferencia = cantidad_nueva - cantidad_anterior  # Diferencia de cantidad

    item.quantity = cantidad_nueva  # Actualizar cantidad
    db.add(item)  # Añadir a sesión para update

    movimiento = Movement(
        item_id=item_id,
        type="ajuste",  # Tipo de movimiento
        amount=diferencia,  # Cantidad modificada
        timestamp=datetime.now(pytz.timezone("Europe/Madrid")),  # Hora Madrid
        username=user,  # Usuario que hace el cambio
        quantity_before=cantidad_anterior,  # Cantidad antes
        quantity_after=cantidad_nueva  # Cantidad después
    )
    db.add(movimiento)  # Añadir movimiento a sesión
    db.commit()  # Guardar cambios
    db.refresh(item)  # Refrescar el item con datos actuales
    return item  # Devolver item actualizado


# Crear un nuevo movimiento y actualizar cantidad del item
def create_movement(db: Session, movement_data: MovementCreate):
    item = db.query(Item).filter(Item.id == movement_data.item_id).first()  # Buscar item
    if not item:
        return None  # Si no existe item, devolver None

    quantity_before = item.quantity  # Cantidad antes de movimiento

    # Ajustar cantidad según tipo de movimiento
    if movement_data.type == "entrada":
        item.quantity += movement_data.amount
    elif movement_data.type == "salida":
        item.quantity -= movement_data.amount

    quantity_after = item.quantity  # Cantidad después de movimiento

    movement = Movement(
        item_id=movement_data.item_id,
        type=movement_data.type,
        amount=movement_data.amount,
        timestamp=datetime.now(madrid_tz),  # Hora Madrid
        username=getattr(movement_data, "username", None),  # Usuario opcional
        quantity_before=quantity_before,
        quantity_after=quantity_after,
    )

    db.add(movement)  # Añadir movimiento
    db.commit()  # Guardar cambios
    db.refresh(movement)  # Refrescar movimiento creado
    return movement  # Devolver movimiento


# Obtener todos los movimientos, ordenados por fecha descendente
def get_movements(db: Session):
    return db.query(Movement).order_by(Movement.timestamp.desc()).all()


# Crear un nuevo item, validando unicidad de SKU y EAN13
def create_item(db: Session, item_data: ItemCreate):
    if db.query(Item).filter(Item.sku == item_data.sku).first():
        return None, "SKU ya existe"  # Error si SKU repetido
    if db.query(Item).filter(Item.ean13 == item_data.ean13).first():
        return None, "EAN13 ya existe"  # Error si EAN13 repetido

    nuevo_item = Item(sku=item_data.sku, ean13=item_data.ean13, quantity=item_data.quantity)
    db.add(nuevo_item)  # Añadir nuevo item
    db.commit()  # Guardar cambios
    db.refresh(nuevo_item)  # Refrescar con id y datos actualizados

    # Crear movimiento de creación para histórico
    movimiento = Movement(
        item_id=nuevo_item.id,
        type="creación",
        amount=nuevo_item.quantity,
        timestamp=datetime.now(madrid_tz),  # Hora Madrid
        quantity_before=0,
        quantity_after=nuevo_item.quantity
    )
    db.add(movimiento)  # Añadir movimiento
    db.commit()  # Guardar cambios

    return nuevo_item, None  # Devolver item creado y sin error


# Buscar usuario por username
def get_user_by_username(db, username: str):
    return db.query(User).filter(User.username == username).first()


# Crear nuevo usuario con password hasheada
def create_user(db, user_data):
    hashed_pw = pwd_context.hash(user_data.password)  # Hashear contraseña
    user = User(username=user_data.username, hashed_password=hashed_pw)
    db.add(user)  # Añadir usuario
    db.commit()  # Guardar cambios
    db.refresh(user)  # Refrescar con id generado
    return user


# Reiniciar base de datos borrando datos y creando usuarios e items iniciales
def reset_database(db: Session):
    print("Resetting database...")  

    db.query(Movement).delete()  # Borrar movimientos
    db.query(Item).delete()  # Borrar items
    db.query(User).delete()  # Borrar usuarios
    db.commit()  # Confirmar borrado

    usuarios_iniciales = ["admin", "guillem", "divain"]  # Usuarios por defecto
    for nombre in usuarios_iniciales:
        create_user(db, UserCreate(username=nombre, password="1234"))  # Crear usuarios con password por defecto

    # Crear items iniciales
    items = [
        Item(sku="SKU123", ean13="1234567890123", quantity=15),
        Item(sku="SKU456", ean13="9876543210987", quantity=5),
        Item(sku="SKU789", ean13="4567890123456", quantity=0),
    ]
    db.add_all(items)  # Añadir todos los items
    db.commit()  # Guardar cambios

    ahora = datetime.now(pytz.timezone("Europe/Madrid"))  # Fecha actual en Madrid
    for item in items:
        movimiento = Movement(
            item_id=item.id,
            type="creación",
            amount=item.quantity,
            timestamp=ahora,
            username="sistema",  # Usuario sistema
            quantity_before=0,
            quantity_after=item.quantity
        )
        db.add(movimiento)  # Añadir movimiento

    db.commit()  # Guardar movimientos
    print("Database reset complete")  # Mensaje de confirmación


# Cambiar la contraseña de un usuario, validando la actual
def change_user_password(db: Session, user: User, old_password: str, new_password: str):
    print(f"Intentando cambiar contraseña de: {user.username}")

    # Recuperar usuario desde DB por id para obtener datos actuales
    user_in_db = db.query(User).filter(User.id == user.id).first()

    # Verificar que la contraseña antigua coincida
    if not pwd_context.verify(old_password, user_in_db.hashed_password):
        return False, "Contraseña actual incorrecta"

    # Hashear la nueva contraseña y actualizarla
    user_in_db.hashed_password = pwd_context.hash(new_password)
    db.commit()  # Guardar cambios
    return True, "Contraseña actualizada correctamente"
