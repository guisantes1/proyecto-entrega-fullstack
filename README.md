# Proyecto Inventario Divain Team

Sistema de gestión de inventario con autenticación y control de usuarios, desarrollado con:

- **Backend:** FastAPI + SQLAlchemy + JWT + PostgreSQL/SQLite  
- **Frontend:** React (Hooks, Fetch API)  
- **Autenticación:** JWT con token expirado y gestión de sesión  
- **Funcionalidades principales:** CRUD de productos, historial de movimientos, cambio de contraseña, control de permisos.

---

## Contenido

- [Presentación](#presentación)  
- [Instalación](#instalación)  
- [Levantamiento y uso](#levantamiento-y-uso)  
- [Backend](#backend)  
    - [Endpoints principales](#endpoints-principales) 
- [Frontend](#frontend)   
- [Resolución de problemas comunes](#resolución-de-problemas-comunes)

---

## Presentación

Este proyecto permite gestionar el inventario de una empresa con autenticación segura mediante JWT. Los usuarios pueden añadir, modificar, eliminar productos y ver el historial de movimientos. También pueden cambiar su contraseña. El sistema controla permisos para ciertas acciones y gestiona la expiración de sesión.

---

## Instalación

### Requisitos previos

Para ejecutar este proyecto es necesario contar con las siguientes herramientas instaladas en su sistema operativo (Windows o macOS):

- **Python 3.9 o superior**  
- **Node.js 18 o superior**  
- **npm o yarn**  
- **PostgreSQL** (opcional; puede usarse SQLite sin configuración adicional)

Este repositorio no incluye los instaladores ni guías de instalación para estas herramientas. Si no dispone de ellas, le recomendamos consultar la documentación oficial o recursos en línea para su correcta instalación y configuración.

Asegúrese de tenerlas instaladas y configuradas antes de iniciar la instalación y ejecución del proyecto.

### Backend

1. Navegue a la carpeta del backend desde la ubicación donde haya descargado o clonado el repositorio de GitHub usando su terminal (macOS/Linux) o cmd (Windows):


```bash
cd inventario-back
```

2. Cree y active entorno virtual:

```bash
# Linux/macOS
python -m venv venv
source venv/bin/activate  
```

```powershell
# Windows
python -m venv venv
.\venv\Scripts\Activate.ps1
```

3. Instale las dependencias:
```bash
pip install -r requirements.txt
```

4. (Opcional) Configure la base de datos en `database.py`:  
   - Por defecto está configurada para PostgreSQL con usuario, host, puerto y base de datos específicos.  
   - Si no tiene PostgreSQL o prefiere usar SQLite para pruebas locales, modifique la cadena `DATABASE_URL` para usar SQLite, por ejemplo:  
   ```python
        DATABASE_URL = "sqlite:///./inventario.db"
   ```

5. Ejecute el servidor backend:
```bash
uvicorn main:app --reload
```

### Frontend

1. Navegue a la carpeta del frontend desde la ubicación donde haya descargado o clonado el repositorio de GitHub usando su terminal (macOS/Linux) o cmd (Windows):

```bash
cd inventario-front
```
> **Nota:** Para facilitar el desarrollo y la ejecución, se recomienda abrir dos terminales independientes: una para el backend (`inventario-back`) y otra para el frontend (`inventario-front`). Así podrá arrancar y controlar ambos servicios simultáneamente.


2. Instale las dependencias listadas en package.json:

```bash
npm install
# o si usas yarn:
# yarn install
```

3. Ejecute la aplicación React:

```bash
npm start
# o con yarn:
# yarn start
```

4. Abra en su navegador la URL:
```http://localhost:3000```


---

## Levantamiento y uso

Los pasos 1 y 2 para arrancar backend y frontend ya se explicaron en la sección [Instalación](#instalación).

1. Arranque el backend (desde la carpeta `inventario-back`):

```bash
uvicorn main:app --reload
```

2. Arranque el frontend (desde la carpeta `inventario-front`):

```bash
npm start
```

3. Abra tu navegador y accede a: 
```http://localhost:3000```

4. Inicie sesión con uno de los usuarios preconfigurados:

| **Usuario** | **Contraseña**|
|---------|------------|
| admin   | 1234       |
| guillem | 1234       |
| divain  | 1234       |

> **Importante:** Se recomienda cambiar las contraseñas predeterminadas tras el primer inicio de sesión para mejorar la seguridad.

5. Gestiona el inventario:

- Añade nuevos productos.
- Actualiza las cantidades.
- Elimina productos.
- Consulta el historial de movimientos por producto.
- Cambia la contraseña desde la app para mayor seguridad.

Tenga en cuenta que el token de sesión expira a los 60 minutos; tras ello deberá volver a iniciar sesión para continuar usando la app.

---

## Backend

El backend está desarrollado con FastAPI, usando SQLAlchemy para la gestión de la base de datos y JWT para la autenticación.

### Archivos principales

- **main.py:** Punto de entrada de la API, define los endpoints y la configuración principal.
- **auth.py:** Contiene la lógica de autenticación y validación de tokens JWT.
- **crud.py:** Operaciones de creación, lectura, actualización y borrado (CRUD) sobre la base de datos.
- **database.py:** Configuración y conexión a la base de datos PostgreSQL (o SQLite).
- **models.py:** Definición de los modelos ORM para productos, movimientos y usuarios.
- **schemas.py:** Definición de esquemas Pydantic para validación y serialización de datos.
- **security.py:** Manejo del hashing y verificación de contraseñas.

### Endpoints principales

#### Autenticación

- `POST /login`  
  Permite iniciar sesión con usuario y contraseña. Devuelve un token JWT para autenticar futuras peticiones.

#### Productos (Items)

- `GET /items`  
  Obtiene la lista de todos los productos. Requiere autenticación.

- `POST /items`  
  Crea un nuevo producto. Requiere autenticación.

- `PUT /items/{item_id}`  
  Actualiza la cantidad de un producto específico. Requiere autenticación.

- `DELETE /items/{item_id}`  
  Elimina un producto y sus movimientos asociados. Requiere autenticación.

#### Movimientos

- `GET /movements`  
  Obtiene el historial de movimientos de inventario. Requiere autenticación.

- `POST /movements`  
  Crea un nuevo movimiento (entrada, salida o ajuste). Requiere autenticación.

### Usuarios

- `POST /change-password`  
  Permite cambiar la contraseña del usuario autenticado. Requiere autenticación.

---

**Notas:**  
- Todas las rutas excepto `/login` requieren un token JWT válido en la cabecera `Authorization: Bearer <token>`.  
- El token tiene una duración de 60 minutos, después se debe iniciar sesión de nuevo.  
- Las operaciones de escritura/modificación requieren estar autenticado.


### Descripción

- La autenticación se maneja con tokens JWT que expiran a los 60 minutos, lo que mejora la seguridad forzando re-login periódico.
- Todas las operaciones sobre productos y movimientos requieren que el usuario esté autenticado.
- Las contraseñas se almacenan cifradas usando hashing bcrypt para proteger los datos de acceso.
- La API sigue buenas prácticas REST con manejo adecuado de códigos HTTP y errores.


---

## Frontend

El frontend está desarrollado con React, usando Hooks y la Fetch API para la comunicación con el backend. La interfaz es sencilla y funcional, con autenticación y control de sesión mediante JWT.

### Estructura principal

- `src/`
  - `App.js` y `App.css`: Componente raíz que maneja el estado global y la navegación, con sus estilos asociados.
  - `Login.js` y `Login.css`: Componente de login con formulario para usuario y contraseña, con sus estilos.
  - `StockList.js` y `StockList.css`: Componente principal que muestra el listado de productos, permite CRUD y consulta de historial, con sus estilos.
  - `index.js` y `index.css`: Entrada principal y estilos globales.
- `public/`
  - `divain_team.png`: Logo principal de la empresa mostrado en la app.
  - `divain_logo.jpeg`: Imagen usada como fondo de pantalla.
  - `d_divain.png`: Icono pequeño usado como favicon (pestaña del navegador).
- `package.json`: Lista de dependencias y scripts para ejecutar la app.
- `deps.json`: Archivo generado con dependencias actuales (no estándar, solo para referencia).

### Dependencias principales

- `react`, `react-dom`: Librerías React básicas.
- `react-scripts`: Scripts y configuraciones para crear y correr la app.
- `luxon`: Librería para manejo de fechas y zonas horarias.
- `@testing-library/react` y otras relacionadas para testing (no esenciales en producción).

---

### Resolución de problemas comunes

- **Error de conexión entre frontend y backend:**  
  Asegúrese de que el backend esté corriendo en `http://localhost:8000`.  
  Verifique que no haya errores en la consola del navegador ni en la terminal donde corre el backend.

- **Error con token JWT (401 Unauthorized):**  
  Este error indica token inválido o expirado.  
  Cierre sesión y vuelva a iniciar sesión para obtener un token válido.

- **Problemas con la base de datos:**  
  Revise la configuración en `database.py`.  
  Para pruebas rápidas, puede usar SQLite modificando `DATABASE_URL` a:  
  ```python
  DATABASE_URL = "sqlite:///./inventario.db"

---
