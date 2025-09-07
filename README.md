# Blog Interactivo

Bienvenido al Blog Interactivo, una plataforma moderna donde los escritores pueden compartir sus artículos y los lectores pueden interactuar con el contenido a través de comentarios y reacciones. La plataforma también incluye un sistema de chat en tiempo real para comunicación directa entre lectores y escritores, además de un panel de administración completo para la gestión del contenido.

## 🚀 Características Principales

### Para Usuarios
- 📝 Lectura de artículos y publicaciones
- 💬 Comentarios en artículos
- ❤️ Reacciones a publicaciones
- 💬 Chat en tiempo real con escritores
- 👤 Perfiles de usuario personalizables

### Para Escritores
- ✍️ Creación y edición de artículos
- 🏷️ Gestión de categorías y etiquetas
- 📊 Estadísticas de interacción
- 💬 Comunicación directa con lectores

### Para Administradores
- 👥 Gestión de usuarios y roles
- 📑 Administración de contenido
- 📈 Panel de análisis y métricas
- ⚙️ Configuración del sitio

## 👥 Roles de Usuario

1. **Administrador (ADMIN)**
   - Control total del sistema
   - Gestión de usuarios y roles
   - Configuración del sitio
   - Moderación de contenido

2. **Escritor (ESCRITOR)**
   - Creación y edición de artículos
   - Gestión de categorías y etiquetas propias
   - Interacción con lectores a través del chat
   - Visualización de estadísticas de artículos

3. **Usuario (USUARIO)**
   - Lectura de artículos
   - Comentarios y reacciones
   - Perfil personalizable
   - Chat con escritores

## 🛠️ Tecnologías Utilizadas

### Frontend
- **React** - Biblioteca para construir interfaces de usuario
- **TypeScript** - Tipado estático para JavaScript
- **Vite** - Herramienta de construcción rápida
- **TailwindCSS** - Framework CSS para diseño responsivo
- **React Query** - Manejo de estado y datos asíncronos
- **React Hook Form** - Gestión de formularios
- **React Router** - Enrutamiento de la aplicación
- **Socket.IO Client** - Comunicación en tiempo real
- **Axios** - Cliente HTTP

### Backend
- **Node.js** - Entorno de ejecución
- **Express** - Framework para APIs
- **MongoDB** - Base de datos NoSQL
- **Mongoose** - ODM para MongoDB
- **Passport.js** - Autenticación
- **JWT** - JSON Web Tokens para autenticación
- **Nodemailer** - Envío de correos electrónicos
- **Socket.IO** - Comunicación en tiempo real
- **Bcrypt** - Encriptación de contraseñas

## 🚀 Configuración del Proyecto

### Requisitos Previos
- Node.js (v16 o superior)
- npm o yarn
- MongoDB (local o Atlas)
- Cuenta de correo para envío de emails (recomendado Gmail)

### Variables de Entorno

#### Backend (`Server/.env`)
```env
PORT=3001
MONGODB_URI=mongodb://localhost:27017/blog_db
JWT_SECRET=tu_clave_secreta_jwt
CLIENT_URL=http://localhost:3000
NODE_ENV=development

# Configuración de correo
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=tu_email@gmail.com
EMAIL_PASS=tu_contraseña_app_especifica

# Configuración de Cloudinary (opcional para almacenamiento de imágenes)
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret
```

#### Frontend (`Client/.env.local`)
```env
VITE_API_URL=http://localhost:3001/api
VITE_SOCKET_URL=http://localhost:3001
VITE_GOOGLE_CLIENT_ID=tu_google_client_id
VITE_FACEBOOK_APP_ID=tu_facebook_app_id
```

## 🛠️ Instalación

### 1. Clonar el repositorio
```bash
git clone https://github.com/tu-usuario/blog-v2.git
cd blog-v2
```

### 2. Configurar el Backend
```bash
cd Server
npm install
cp .env.example .env
# Editar el archivo .env con tus configuraciones
npm run dev
```

### 3. Configurar el Frontend
```bash
cd ../Client
npm install
cp .env.local.example .env.local
# Editar el archivo .env.local con tus configuraciones
npm run dev
```

### 4. Iniciar la aplicación
- El backend estará disponible en: http://localhost:3001
- El frontend estará disponible en: http://localhost:3000

## 📂 Estructura del Proyecto

```
blog-v2/
├── Client/                 # Aplicación Frontend
│   ├── public/            # Archivos estáticos
│   └── src/               # Código fuente del frontend
│       ├── API/           # Servicios API
│       ├── components/    # Componentes reutilizables
│       ├── context/       # Contextos de React
│       ├── hooks/         # Custom hooks
│       ├── layouts/       # Layouts
│       ├── lib/           # Configuraciones
│       ├── locales/       # Idiomas
│       ├── types/         # Tipos de datos
│       ├── utils/         # Utilidades
│       ├── views/         # Páginas de la aplicación
│
└── Server/                # Aplicación Backend
    ├── src/
    │   ├── config/       # Configuraciones
    │   ├── controllers/  # Controladores
    │   ├── email/        # Funcionalidades de correo
    │   ├── middleware/   # Middlewares
    │   ├── models/       # Modelos de datos
    │   ├── routes/       # Rutas de la API
    │   ├── services/     # Lógica de negocio
    │   └── utils/        # Utilidades
    └── .env              # Variables de entorno
```

## 🧪 Testing

Para ejecutar los tests:

```bash
# En la carpeta del servidor
npm test

# En la carpeta del cliente
cd ../Client
npm test
```

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Consulta el archivo [LICENSE](LICENSE) para más información.

## 🤝 Contribución

Las contribuciones son bienvenidas. Por favor, lee las [pautas de contribución](CONTRIBUTING.md) antes de enviar un pull request.

## 📧 Contacto

Si tienes alguna pregunta o sugerencia, no dudes en contactarme en [lautarozule80@gmail.com](mailto:lautarozule80@gmail.com)