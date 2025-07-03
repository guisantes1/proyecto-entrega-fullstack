from passlib.context import CryptContext  # Importa la clase para manejo seguro de contraseñas

# Crea un contexto para hashing de contraseñas usando el algoritmo bcrypt
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
# "deprecated='auto'" maneja automáticamente esquemas obsoletos si se usan
