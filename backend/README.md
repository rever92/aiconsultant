# AI Consultant Backend

Backend Express.js con MongoDB para la aplicación AI Consultant.

## 🚀 Configuración Inicial

### 1. Instalar dependencias

```bash
cd backend
npm install
```

### 2. Configurar variables de entorno

Crea un archivo `.env` en la carpeta `backend` con el siguiente contenido:

```env
# Puerto del servidor
PORT=5000

# Base de datos MongoDB
MONGODB_URI=mongodb://localhost:27017/aiconsultant

# JWT
JWT_SECRET=tu_jwt_secret_super_seguro_aqui_cambiar_en_produccion
JWT_EXPIRES_IN=24h

# APIs de IA
GEMINI_API_KEY=tu_clave_gemini_aqui
GROQ_API_KEY=tu_clave_groq_aqui
ASSEMBLYAI_API_KEY=tu_clave_assemblyai_aqui

# Entorno
NODE_ENV=development

# CORS
CORS_ORIGIN=http://localhost:3000
```

### 3. Asegurarse de que MongoDB esté ejecutándose

```bash
# Verificar que MongoDB está corriendo
mongod --version

# O iniciar MongoDB si no está ejecutándose
mongod
```

### 4. Ejecutar el servidor

```bash
# Desarrollo con auto-reload
npm run dev

# Producción
npm start
```

El servidor estará disponible en: http://localhost:5000

## 📡 Endpoints Disponibles

### Autenticación (`/api/auth`)
- `POST /api/auth/register` - Registrar usuario
- `POST /api/auth/login` - Iniciar sesión  
- `POST /api/auth/logout` - Cerrar sesión
- `GET /api/auth/me` - Obtener perfil actual
- `PUT /api/auth/me` - Actualizar perfil
- `POST /api/auth/refresh` - Renovar token

### Health Check
- `GET /api/health` - Verificar estado del servidor

## 🧪 Probar la API

### 1. Health Check
```bash
curl http://localhost:5000/api/health
```

### 2. Registrar usuario
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "123456",
    "fullName": "Usuario de Prueba",
    "role": "admin"
  }'
```

### 3. Iniciar sesión
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "123456"
  }'
```

## 📁 Estructura del Proyecto

```
backend/
├── src/
│   ├── config/
│   │   └── database.js          # Configuración MongoDB
│   │   └── auth.js              # Middleware autenticación
│   ├── models/
│   │   ├── User.js              # Modelo Usuario
│   │   ├── Project.js           # Modelo Proyecto
│   │   ├── Area.js              # Modelo Área
│   │   └── Knowledge.js         # Modelo Conocimiento
│   ├── routes/
│   │   ├── auth.js              # Rutas autenticación
│   │   ├── users.js             # Rutas usuarios (TODO)
│   │   ├── projects.js          # Rutas proyectos (TODO)
│   │   ├── areas.js             # Rutas áreas (TODO)
│   │   ├── knowledge.js         # Rutas conocimiento (TODO)
│   │   └── transcription.js     # Rutas transcripción (TODO)
│   └── server.js                # Servidor principal
├── package.json
└── README.md
```

## 🔑 Autenticación

El backend usa JWT (JSON Web Tokens) para autenticación:

1. **Registro/Login**: Devuelve `token` y `refreshToken`
2. **Requests autenticados**: Incluir header `Authorization: Bearer <token>`
3. **Renovar token**: Usar endpoint `/api/auth/refresh` con `refreshToken`

## 🗃️ Base de Datos

### Colecciones MongoDB:
- `users` - Usuarios del sistema
- `projects` - Proyectos de consultoría  
- `areas` - Áreas organizacionales
- `knowledges` - Conocimiento/documentos

### Relaciones:
- Usuario → Proyectos (1:N)
- Proyecto → Áreas (1:N) 
- Área → Conocimiento (N:M)

## 🛠️ Próximos Pasos

1. ✅ Autenticación JWT
2. ⏳ Rutas de proyectos
3. ⏳ Rutas de áreas  
4. ⏳ Rutas de conocimiento
5. ⏳ Upload de archivos
6. ⏳ Integración con APIs de IA
7. ⏳ Migración desde Supabase

## 🔧 Desarrollo

```bash
# Instalar dependencias
npm install

# Desarrollo con nodemon
npm run dev

# Tests (cuando estén configurados)
npm test
``` 