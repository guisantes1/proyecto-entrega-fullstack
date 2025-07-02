from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from database import SessionLocal, engine
from models import Base, Item, Movement, User
from auth import get_current_user
import crud
from crud import reset_database, change_user_password
from schemas import ItemOut, ItemCreate, ItemUpdate, MovementOut, MovementCreate, UserCreate, ChangePassword
from datetime import datetime
import pytz
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from jose import JWTError, jwt
from datetime import timedelta


# Crear tablas
Base.metadata.create_all(bind=engine)

with SessionLocal() as db:
    print("Checking DB tables...")
    if (not db.query(Item).first()) or (not db.query(User).first()) or (not db.query(Movement).first()):
        print("Tables empty or incomplete, resetting database")
        reset_database(db)
        print("Reset done")
    else:
        print("DB tables already have data")



app = FastAPI()

SECRET_KEY = "clave-super-secreta"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

def create_access_token(data: dict, expires_delta: timedelta):
    to_encode = data.copy()
    expire = datetime.utcnow() + expires_delta
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)



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
def update_item(
    item_id: int,
    item: ItemUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    updated = crud.update_item_quantity(db, item_id, item, user=current_user.username)
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

@app.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = crud.get_user_by_username(db, form_data.username)
    if not user or not user.verify_password(form_data.password):
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")

    # Comprobar si alguna tabla está vacía y resetear si es necesario
    tablas_vacias = (
        not db.query(Item).first() or
        not db.query(User).first() or
        not db.query(Movement).first()
    )
    if tablas_vacias:
        reset_database(db)

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    token = create_access_token(
        data={"sub": user.username},
        expires_delta=access_token_expires
    )
    return {"access_token": token, "token_type": "bearer"}


@app.post("/reset")
def reset_all(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.username != "admin":
        raise HTTPException(status_code=403, detail="No autorizado")

    reset_database(db)
    return {"detail": "Base de datos reseteada correctamente"}


@app.post("/change-password")
def change_password(
    datos: ChangePassword,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    success, message = crud.change_user_password(db, current_user, datos.old_password, datos.new_password)
    if not success:
        raise HTTPException(status_code=400, detail=message)
    return {"detail": message}


