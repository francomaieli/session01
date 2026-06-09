# Frontend React + Tailwind (JWT Auth)

Aplicación web en React + Tailwind CSS que consume el backend JWT:

- `POST /auth/token` para login
- `POST /auth/refresh` para refrescar tokens

## Funcionalidades

- Pantalla de login con credenciales de ejemplo:
  - usuario: `admin`
  - password: `admin123`
- Almacena sesión en `localStorage` con:
  - `access_token`
  - `refresh_token`
  - usuario autenticado
  - fechas de expiración extraídas del JWT
- Redirección a página protegida (`/dashboard`) luego del login
- Panel principal con:
  - información del usuario autenticado
  - validación básica del estado del `access_token`
  - acción para refrescar token
  - logout

## Configuración de URL del backend

Se configura con la variable de entorno:

```bash
VITE_BACKEND_URL=http://localhost:8000
```

Si no se define, el valor por defecto es `http://localhost:8000`.

## Ejecución local

```bash
cd frontend
npm install
npm run dev
```

Abrir: `http://localhost:5173`

## Build producción

```bash
cd frontend
npm run build
npm run preview
```

## Docker

### Build y ejecución con Docker Compose

```bash
cd frontend
VITE_BACKEND_URL=http://localhost:8000 docker compose up --build -d
```

La app queda publicada en `http://localhost:3000`.

### Detener contenedores

```bash
cd frontend
docker compose down
```
