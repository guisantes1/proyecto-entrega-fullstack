from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Configuración de conexión a la base de datos PostgreSQL
DB_USER = "guillemsanchezescoi"  # Usuario de la base de datos
DB_PASSWORD = ""  # Contraseña de la base de datos (vacío si no hay)
DB_HOST = "localhost"  # Host donde está la base de datos
DB_PORT = "5432"  # Puerto de conexión a PostgreSQL
DB_NAME = "inventario"  # Nombre de la base de datos

# Cadena de conexión completa con formato para PostgreSQL
DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

# Crear motor de base de datos para conectar con PostgreSQL
engine = create_engine(DATABASE_URL)

# Crear fábrica de sesiones que manejarán las transacciones
SessionLocal = sessionmaker(
    autocommit=False,  # No hacer commit automático (control manual)
    autoflush=False,   # No hacer flush automático (control manual)
    bind=engine       # Asociar sesiones con el motor de base de datos
)

# Crear clase base para modelos declarativos (ORM)
Base = declarative_base()
