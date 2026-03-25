# MySchool Portal - Architecture Documentation

## System Overview

The MySchool Portal is a full-stack web application designed for educational resource management. It consists of a React frontend, FastAPI backend, and MongoDB database, with cloud storage for media files.

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              INTERNET                                        │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CLOUDFLARE CDN                                       │
│                    (SSL/TLS, DDoS Protection)                               │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         NGINX REVERSE PROXY                                  │
│                        (Load Balancing, SSL)                                │
│                                                                             │
│  ┌─────────────────────┐              ┌─────────────────────┐              │
│  │   Static Files      │              │   API Requests      │              │
│  │   /var/www/portal   │              │   /api/*            │              │
│  └──────────┬──────────┘              └──────────┬──────────┘              │
└─────────────┼─────────────────────────────────────┼─────────────────────────┘
              │                                     │
              ▼                                     ▼
┌─────────────────────────┐           ┌─────────────────────────┐
│     REACT FRONTEND      │           │    FASTAPI BACKEND      │
│    (Static Build)       │           │    (Port 3023)          │
│                         │           │                         │
│  • React 18             │           │  • Python 3.11          │
│  • Material UI          │           │  • FastAPI Framework    │
│  • Redux Toolkit        │           │  • Uvicorn Server       │
│  • React Router v6      │           │  • JWT Authentication   │
└─────────────────────────┘           └────────────┬────────────┘
                                                   │
                    ┌──────────────────────────────┼──────────────────────────┐
                    │                              │                          │
                    ▼                              ▼                          ▼
        ┌─────────────────────┐      ┌─────────────────────┐    ┌─────────────────────┐
        │     MONGODB         │      │   CLOUDFLARE R2     │    │   SMTP SERVER       │
        │   (Database)        │      │   (Object Storage)  │    │   (Gmail)           │
        │                     │      │                     │    │                     │
        │  • Users            │      │  • Images           │    │  • Notifications    │
        │  • Schools          │      │  • PDFs             │    │  • Password Reset   │
        │  • Subscriptions    │      │  • Documents        │    │  • Welcome Emails   │
        │  • Logs             │      │  • Templates        │    │  • Bulk Uploads     │
        └─────────────────────┘      └─────────────────────┘    └─────────────────────┘
```

---

## Component Architecture

### Frontend Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           REACT APPLICATION                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │
│  │   COMPONENTS    │  │     PAGES       │  │     HOOKS       │             │
│  │                 │  │                 │  │                 │             │
│  │  • Header       │  │  • Home         │  │  • useCredits   │             │
│  │  • Footer       │  │  • Dashboard    │  │  • useSnackbar  │             │
│  │  • Sidebar      │  │  • Academic     │  │  • useAuth      │             │
│  │  • ImageViewer  │  │  • Search       │  │  • useSession   │             │
│  │  • DataTable    │  │  • Maker        │  │                 │             │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘             │
│           │                    │                    │                       │
│           └────────────────────┼────────────────────┘                       │
│                                ▼                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        REDUX STORE                                   │   │
│  │                                                                      │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │   │
│  │  │  authSlice   │  │ searchSlice  │  │  userSlice   │              │   │
│  │  │              │  │              │  │              │              │   │
│  │  │ • user       │  │ • results    │  │ • profile    │              │   │
│  │  │ • token      │  │ • filters    │  │ • credits    │              │   │
│  │  │ • role       │  │ • pagination │  │ • favorites  │              │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘              │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                │                                            │
│                                ▼                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        API SERVICE                                   │   │
│  │                    (Axios HTTP Client)                               │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Backend Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          FASTAPI APPLICATION                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                           ROUTERS                                    │   │
│  │                                                                      │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │   │
│  │  │ auth_router │ │users_router │ │admin_router │ │search_router│   │   │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘   │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │   │
│  │  │images_router│ │payment_route│ │support_route│ │template_rout│   │   │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                │                                            │
│                                ▼                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        MIDDLEWARE                                    │   │
│  │                                                                      │   │
│  │  • CORS Middleware          • Rate Limiting                         │   │
│  │  • Authentication Middleware • Request Logging                       │   │
│  │  • Error Handling           • Response Compression                   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                │                                            │
│                                ▼                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         SERVICES                                     │   │
│  │                                                                      │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │   │
│  │  │ AuthService  │  │ EmailService │  │StorageService│              │   │
│  │  │              │  │              │  │              │              │   │
│  │  │ • JWT tokens │  │ • SMTP       │  │ • R2 Upload  │              │   │
│  │  │ • Password   │  │ • Templates  │  │ • Download   │              │   │
│  │  │ • OTP        │  │ • Async Send │  │ • Thumbnail  │              │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘              │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                │                                            │
│                                ▼                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     DATABASE LAYER                                   │   │
│  │                    (Motor - Async MongoDB)                           │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Database Schema

### Users Collection
```javascript
{
  _id: ObjectId,
  userId: String (UUID),
  name: String,
  email: String (unique, indexed),
  password_hash: String,
  phone: String,
  role: Enum["SUPER_ADMIN", "SCHOOL_ADMIN", "TEACHER", "STUDENT"],
  schoolCode: String,
  credits: Number,
  subscription: {
    planId: String,
    startDate: Date,
    endDate: Date,
    status: String
  },
  require_password_change: Boolean,
  registration_type: Enum["admin_created", "self_registered"],
  added_by: String,
  isActive: Boolean,
  created_at: Date,
  updated_at: Date
}
```

### Schools Collection
```javascript
{
  _id: ObjectId,
  code: String (unique, indexed),
  name: String,
  address: String,
  city: String,
  state: String,
  adminEmail: String,
  adminName: String,
  isActive: Boolean,
  subscription: {
    planId: String,
    seats: Number,
    usedSeats: Number
  },
  created_at: Date
}
```

### Download Logs Collection
```javascript
{
  _id: ObjectId,
  user_id: String,
  school_id: String,
  image_id: String,
  action: Enum["download", "print", "view"],
  credits_used: Number,
  created_at: Date
}
```

### Support Tickets Collection
```javascript
{
  _id: ObjectId,
  ticketId: String,
  userId: String,
  subject: String,
  message: String,
  category: String,
  status: Enum["open", "in_progress", "resolved"],
  created_at: Date,
  resolved_at: Date
}
```

### Templates Collection
```javascript
{
  _id: ObjectId,
  templateId: String,
  userId: String,
  name: String,
  type: Enum["certificate", "idcard", "flashcard"],
  content: Object,
  created_at: Date,
  updated_at: Date
}
```

---

## Security Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SECURITY LAYERS                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │ Layer 1: Network Security                                              │ │
│  │ • Cloudflare WAF                                                       │ │
│  │ • DDoS Protection                                                      │ │
│  │ • SSL/TLS Encryption                                                   │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                    │                                        │
│                                    ▼                                        │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │ Layer 2: Application Security                                          │ │
│  │ • JWT Token Authentication                                             │ │
│  │ • Role-Based Access Control (RBAC)                                     │ │
│  │ • Input Validation & Sanitization                                      │ │
│  │ • Rate Limiting                                                        │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                    │                                        │
│                                    ▼                                        │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │ Layer 3: Data Security                                                 │ │
│  │ • Password Hashing (bcrypt)                                            │ │
│  │ • Encrypted Database Connections                                       │ │
│  │ • Secure Cookie Handling                                               │ │
│  │ • XSS/CSRF Protection                                                  │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Authentication Flow

```
┌──────────┐      ┌──────────┐      ┌──────────┐      ┌──────────┐
│  Client  │      │  Nginx   │      │  FastAPI │      │ MongoDB  │
└────┬─────┘      └────┬─────┘      └────┬─────┘      └────┬─────┘
     │                 │                 │                 │
     │  POST /login    │                 │                 │
     │────────────────>│                 │                 │
     │                 │  Forward        │                 │
     │                 │────────────────>│                 │
     │                 │                 │  Query User     │
     │                 │                 │────────────────>│
     │                 │                 │                 │
     │                 │                 │  User Data      │
     │                 │                 │<────────────────│
     │                 │                 │                 │
     │                 │                 │ Verify Password │
     │                 │                 │ Generate JWT    │
     │                 │                 │                 │
     │                 │  JWT Token      │                 │
     │                 │<────────────────│                 │
     │  JWT Token      │                 │                 │
     │<────────────────│                 │                 │
     │                 │                 │                 │
```

---

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        HOSTINGER VPS SERVER                                  │
│                         (Ubuntu 22.04 LTS)                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         NGINX                                        │   │
│  │                    (Reverse Proxy)                                   │   │
│  │                                                                      │   │
│  │  Port 80  ──────────────────────────────────────> Port 443 (HTTPS)  │   │
│  │                                                                      │   │
│  │  /api/*  ────────────────────────────────────────> localhost:3023   │   │
│  │  /*      ────────────────────────────────────────> /var/www/portal  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌──────────────────────────┐    ┌──────────────────────────┐             │
│  │   SYSTEMD SERVICE        │    │    PM2 PROCESS           │             │
│  │   (myschool-backend)     │    │    (myschool-chatbot)    │             │
│  │                          │    │                          │             │
│  │   FastAPI + Uvicorn      │    │    Node.js + Express     │             │
│  │   Port: 3023             │    │    Port: 3006            │             │
│  └──────────────────────────┘    └──────────────────────────┘             │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        MONGODB                                       │   │
│  │                    (localhost:27017)                                 │   │
│  │                                                                      │   │
│  │   Database: myschool_portal                                         │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.x | UI Framework |
| Material UI | 5.x | Component Library |
| Redux Toolkit | 1.9.x | State Management |
| React Router | 6.x | Routing |
| Axios | 1.x | HTTP Client |
| React-to-Print | 2.x | Print Functionality |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Python | 3.11 | Runtime |
| FastAPI | 0.100+ | Web Framework |
| Uvicorn | 0.23+ | ASGI Server |
| Motor | 3.x | Async MongoDB Driver |
| PyJWT | 2.x | JWT Handling |
| aiosmtplib | 2.x | Async Email |
| pdf2image | 1.16+ | PDF Thumbnails |
| bcrypt | 4.x | Password Hashing |

### Infrastructure
| Technology | Purpose |
|------------|---------|
| Nginx | Reverse Proxy |
| MongoDB | Database |
| Cloudflare R2 | Object Storage |
| Let's Encrypt | SSL Certificates |
| Systemd | Process Management |
| PM2 | Node.js Process Manager |

---

## Performance Considerations

### Caching Strategy
- Browser caching for static assets (1 year)
- API response caching where applicable
- Image thumbnail caching

### Database Optimization
- Indexed fields: email, userId, schoolCode
- Compound indexes for common queries
- Pagination for large result sets

### Frontend Optimization
- Code splitting by route
- Lazy loading of images
- Minified production builds
- Gzip compression

---

**Document Version:** 1.0
**Last Updated:** March 2026
**Developer:** info@expertaid.in
