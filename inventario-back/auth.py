from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt, ExpiredSignatureError
from sqlalchemy.orm import Session
from database import SessionLocal
from models import User

SECRET_KEY = "clave-super-secreta"  # Clave secreta para firmar y verificar JWT
ALGORITHM = "HS256"  # Algoritmo para el cifrado del token JWT

# Esquema OAuth2 para obtener token desde endpoint /login
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

# Función para obtener sesión de base de datos
def get_db():
    db = SessionLocal()  # Crear sesión
    try:
        yield db  # Proveer sesión para uso en endpoints
    finally:
        db.close()  # Cerrar sesión al finalizar

# Función para obtener el usuario actual según token JWT
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    # Excepción a lanzar si el token no es válido o no se puede autenticar
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,  # Código HTTP 401
        detail="No se pudo validar el token",  # Mensaje de error
        headers={"WWW-Authenticate": "Bearer"},  # Header para esquema Bearer
    )
    try:
        # Decodificar token con clave secreta y algoritmo definido
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")  # Obtener nombre de usuario del campo 'sub'
        if username is None:
            raise credentials_exception  # Si no hay usuario, lanzar excepción
    except ExpiredSignatureError:
        # Token ha expirado: lanzar excepción con mensaje específico
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Signature has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except JWTError:
        # Cualquier otro error en token: lanzar excepción general de credenciales inválidas
        raise credentials_exception

    # Buscar usuario en base de datos por username obtenido
    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise credentials_exception  # Si no existe usuario, lanzar excepción

    return user  # Devolver usuario válido para uso en endpoint
