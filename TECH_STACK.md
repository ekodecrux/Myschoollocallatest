# MySchool Portal - Technology Stack

## Frontend

### Core
- React 18.x (Create React App with CRACO)
- React Router v6
- Redux Toolkit (State Management)

### UI Components
- Material-UI (MUI) v5
- TailwindCSS
- React Horizontal Scrolling Menu

### Key Libraries
- Axios (HTTP Client)
- Firebase (Push Notifications)
- Polotno (Chart/Design Maker)
- React PDF (Document Viewer)

## Backend

### Core
- Python 3.10+
- FastAPI
- Uvicorn (ASGI Server)

### Database
- MongoDB (Primary Database)
- Motor (Async MongoDB Driver)

### Authentication
- JWT (JSON Web Tokens)
- Bcrypt (Password Hashing)

### Storage
- Cloudflare R2 (Image/Asset Storage)
- Boto3 (S3-compatible SDK)

### Email
- SMTP (Gmail)
- Jinja2 (Email Templates)

## Infrastructure

### Hosting
- Hostinger VPS (Ubuntu 22.04)

### Web Server
- Nginx (Reverse Proxy + Static Files)

### SSL
- Let's Encrypt (Certbot)

### Process Management
- Systemd / PM2

## API Endpoints

### Authentication
- POST /api/auth/login
- POST /api/auth/register
- POST /api/auth/forgot-password
- POST /api/auth/reset-password

### Images
- POST /api/rest/images/fetch
- GET /api/rest/images/list-all-paginated
- POST /api/rest/images/upload

### Users
- GET /api/users/profile
- PUT /api/users/profile
- GET /api/users/list

### Schools
- GET /api/schools/list
- POST /api/schools/create
- PUT /api/schools/{id}

### Admin
- GET /api/admin/dashboard-stats
- GET /api/admin/user-logs
- POST /api/admin/bulk-upload

## External Services

### Cloudflare R2
- Image storage and CDN
- S3-compatible API

### Payment Gateway
- Razorpay (Indian payments)

### Analytics
- Custom dashboard analytics
- User activity tracking
