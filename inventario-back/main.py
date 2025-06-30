from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from database import SessionLocal, engine
from models import Base, Item, Movement
import crud
from schemas import ItemOut, ItemCreate, ItemUpdate, MovementOut, MovementCreate
from datetime import datetime
import pytz

# Crear las tablas
Base.metadata.create_all(bind=engine)

# Insertar datos de prueba si no existen y crear movimiento en log
db = SessionLocal()
if not db.query(Item).first():
    items = [
        Item(sku="SKU123", ean13="1234567890123", quantity=15),
        Item(sku="SKU456", ean13="9876543210987", quantity=5),
        Item(sku="SKU789", ean13="4567890123456", quantity=0),
    ]
    db.add_all(items)
    db.commit()

    # Añadir movimiento de creación con fecha y hora Madrid
    madrid_tz = pytz.timezone('Europe/Madrid')
    ahora_madrid = datetime.now(madrid_tz)

    for item in items:
        movimiento_creacion = Movement(
            item_id=item.id,
            type="creación",
            amount=item.quantity,
            timestamp=ahora_madrid,
            username="sistema",
            quantity_before=0,
            quantity_after=item.quantity
        )
        db.add(movimiento_creacion)

    db.commit()
    print("Datos de prueba insertados y movimientos de creación añadidos")
db.close()

app = FastAPI()

# (resto igual)


origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/items", response_model=list[ItemOut])
def read_items(db: Session = Depends(get_db)):
    return crud.get_items(db)

@app.put("/items/{item_id}", response_model=ItemOut)
def update_item(item_id: int, item: ItemUpdate, db: Session = Depends(get_db)):
    updated = crud.update_item_quantity(db, item_id, item, user=None)
    if not updated:
        raise HTTPException(status_code=404, detail="Item not found")
    return updated

@app.get("/movements", response_model=list[MovementOut])
def read_movements(db: Session = Depends(get_db)):
    return crud.get_movements(db)

@app.post("/movements", response_model=MovementOut)
def create_movement(movement: MovementCreate, db: Session = Depends(get_db)):
    return crud.create_movement(db, movement)

@app.delete("/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_item(item_id: int, db: Session = Depends(get_db)):
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item no encontrado")
    db.query(Movement).filter(Movement.item_id == item_id).delete()
    db.delete(item)
    db.commit()
    return {"detail": "Item eliminado"}

@app.post("/items", response_model=ItemOut)
def create_item(item: ItemCreate, db: Session = Depends(get_db)):
    nuevo_item, error = crud.create_item(db, item)
    if error:
        raise HTTPException(status_code=400, detail=error)
    return nuevo_item
