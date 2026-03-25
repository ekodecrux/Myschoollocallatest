# MySchool Portal - Code Repository Structure

## Overview
This document describes the complete directory structure and file organization of the MySchool Portal codebase.

---

## Root Directory Structure

```
myschool-portal/
├── backend/                    # FastAPI Backend Application
├── frontend/                   # React Frontend Application
├── docs/                       # Documentation
├── .env.example               # Environment variables template
├── .gitignore                 # Git ignore rules
└── README.md                  # Project overview
```

---

## Backend Structure

```
backend/
├── server.py                  # Main FastAPI application (monolithic)
├── requirements.txt           # Python dependencies
├── .env                       # Environment variables (not in git)
│
├── Routers (defined in server.py):
│   ├── auth_router           # /api/rest/auth/*
│   ├── users_router          # /api/rest/users/*
│   ├── school_mgmt_router    # /api/rest/schools/*
│   ├── admin_router          # /api/rest/admin/*
│   ├── search_router         # /api/rest/search/*
│   ├── images_router         # /api/rest/images/*
│   ├── payment_router        # /api/rest/payment/*
│   ├── support_router        # /api/rest/support/*
│   ├── templates_router      # /api/rest/templates/*
│   └── orders_router         # /api/rest/orders/*
│
└── Key Functions:
    ├── Authentication
    │   ├── create_access_token()
    │   ├── verify_token()
    │   ├── get_current_user()
    │   └── hash_password() / verify_password()
    │
    ├── Email Services
    │   ├── send_email()
    │   ├── send_welcome_email()
    │   └── send_password_reset_email()
    │
    ├── Storage Services
    │   ├── upload_to_r2()
    │   ├── download_from_r2()
    │   └── generate_pdf_thumbnail()
    │
    └── Database Operations
        ├── MongoDB connection (Motor)
        └── CRUD operations for all collections
```

### Backend Environment Variables

```
# backend/.env
MONGO_URL=mongodb://localhost:27017
DB_NAME=myschool_portal

# JWT Configuration
JWT_SECRET_KEY=your-secret-key
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM="MySchool <your-email@gmail.com>"

# Cloudflare R2 Storage
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET_NAME=your-bucket-name
R2_PUBLIC_URL=https://your-bucket.r2.dev

# Razorpay Payment
RAZORPAY_KEY_ID=rzp_test_xxx
RAZORPAY_KEY_SECRET=your-secret

# Admin Configuration
ADMIN_EMAIL=admin@myschool.com
```

---

## Frontend Structure

```
frontend/
├── public/                    # Static public assets
│   ├── index.html            # HTML template
│   ├── favicon.ico           # Site favicon
│   └── manifest.json         # PWA manifest
│
├── src/                       # Source code
│   ├── App.jsx               # Root component
│   ├── App.css               # Global styles
│   ├── index.js              # Entry point
│   │
│   ├── components/           # Reusable components
│   │   ├── auth/             # Authentication components
│   │   │   ├── login/        # Login dialog
│   │   │   ├── signUp/       # Registration dialog
│   │   │   └── views/        # Dashboard views
│   │   │       ├── dashboard/
│   │   │       ├── tabs/     # Schools, Teachers, Students tabs
│   │   │       └── imageRenderer/
│   │   │
│   │   ├── common/           # Common components
│   │   │   ├── search/       # Search components
│   │   │   └── dialogs/      # Common dialogs
│   │   │
│   │   ├── header/           # Header/Navigation
│   │   │   ├── Navbar/
│   │   │   ├── Menubar/
│   │   │   ├── MegaMenu/
│   │   │   └── MobileMenu/
│   │   │
│   │   ├── footerComponents/ # Footer components
│   │   │   ├── privacy/
│   │   │   ├── terms/
│   │   │   └── help/
│   │   │
│   │   ├── screens/          # Main screen components
│   │   │   ├── academics/    # Academic resources
│   │   │   ├── edutainment/  # Edutainment section
│   │   │   ├── maker/        # Maker tools
│   │   │   ├── sections/     # Section views
│   │   │   └── results/      # Search results
│   │   │
│   │   ├── makers/           # Maker tool components
│   │   │   ├── certificate/
│   │   │   ├── idcard/
│   │   │   └── flashcard/
│   │   │
│   │   └── homeScreen/       # Homepage components
│   │
│   ├── pages/                # Page components
│   │   ├── admin/            # Admin pages
│   │   ├── home/             # Home page
│   │   └── result/           # Result pages
│   │
│   ├── redux/                # Redux state management
│   │   ├── store.js          # Redux store configuration
│   │   ├── slices/           # Redux slices
│   │   │   ├── authSlice.js
│   │   │   ├── searchSlice.js
│   │   │   ├── userSlice.js
│   │   │   └── SearchImages.js
│   │   └── fetchSearchSlice.js
│   │
│   ├── Routes/               # Routing configuration
│   │   └── routes.jsx        # Route definitions
│   │
│   ├── config/               # Configuration
│   │   └── api.js            # API configuration
│   │
│   ├── customTheme/          # Custom MUI theme
│   │   ├── textField/        # Custom text fields
│   │   └── authSearchField/
│   │
│   ├── hook/                 # Custom React hooks
│   │   ├── useCredits.js     # Credits management
│   │   ├── useSnackbar.js    # Toast notifications
│   │   └── useSessionTimeout.js
│   │
│   ├── uicomponent/          # UI components
│   │   ├── filter/           # Filter components
│   │   ├── structureFiltering/
│   │   └── CreditsDialog/
│   │
│   ├── utils/                # Utility functions
│   │   └── fieldValidation.js
│   │
│   └── assests/              # Assets (images, icons)
│       └── homeScreen/
│
├── package.json              # NPM dependencies
├── yarn.lock                 # Yarn lock file
└── .env                      # Environment variables
```

### Frontend Environment Variables

```
# frontend/.env
REACT_APP_BACKEND_URL=https://portal.myschoolct.com
REACT_APP_RAZORPAY_KEY_ID=rzp_test_xxx
```

---

## Key Files Description

### Backend Files

| File | Description |
|------|-------------|
| `server.py` | Main FastAPI application containing all routes, models, and business logic |
| `requirements.txt` | Python package dependencies |
| `.env` | Environment configuration (database, email, storage, payment) |

### Frontend Files

| File | Description |
|------|-------------|
| `src/App.jsx` | Root React component with routing setup |
| `src/redux/store.js` | Redux store configuration |
| `src/Routes/routes.jsx` | Application route definitions |
| `src/config/api.js` | API endpoint configuration |
| `src/hook/useCredits.js` | Credits management hook |
| `src/components/auth/login/Login.jsx` | Login component |
| `src/components/auth/signUp/SignUp.jsx` | Registration component |
| `src/components/auth/views/imageRenderer/ImageRenderer.jsx` | Image viewer with print/download |
| `src/components/screens/academics/selectImage.jsx` | Selected images tray |
| `src/components/search/EnhancedSearch.jsx` | Main search component |

---

## Component Hierarchy

```
App.jsx
├── Header
│   ├── Navbar
│   │   ├── Logo
│   │   ├── SearchBar
│   │   └── UserMenu
│   ├── Menubar
│   └── MegaMenu
│
├── Routes
│   ├── Home (/)
│   ├── Academic (/views/academic)
│   ├── Search Results (/views/result)
│   ├── Maker (/views/maker)
│   ├── Dashboard (/auth/dashboard)
│   ├── Schools (/auth/school)
│   ├── Teachers (/auth/teachers)
│   └── Students (/auth/students)
│
├── Dialogs
│   ├── LoginDialog
│   ├── SignUpDialog
│   ├── CreditsDialog
│   └── ImagePreviewDialog
│
└── Footer
    ├── AboutLinks
    ├── PolicyLinks
    └── ContactInfo
```

---

## State Management

### Redux Slices

```
store/
├── authSlice
│   ├── user
│   ├── token
│   ├── role
│   └── isAuthenticated
│
├── searchSlice
│   ├── query
│   ├── results
│   ├── filters
│   └── pagination
│
├── userSlice
│   ├── profile
│   ├── credits
│   ├── favorites
│   └── downloads
│
└── SearchImages
    ├── selectedImages
    ├── myImages
    └── favoriteImages
```

---

## API Integration

### API Service Structure

```javascript
// src/config/api.js
const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

const endpoints = {
  auth: {
    login: '/api/rest/auth/login',
    register: '/api/rest/auth/register',
    refresh: '/api/rest/auth/refreshToken',
    forgotPassword: '/api/rest/auth/forgotPassword',
  },
  users: {
    profile: '/api/rest/users/getUserDetails',
    update: '/api/rest/users/updateUserDetails',
    credits: '/api/rest/users/checkCredits',
  },
  search: {
    global: '/api/rest/search/global',
    suggestions: '/api/rest/search/suggestions',
  },
  images: {
    download: '/api/rest/images/download',
    myImages: '/api/rest/images/myImages/get',
    favorites: '/api/rest/images/myImages/getFavourite',
  },
  admin: {
    dashboard: '/api/rest/admin/dashboard-stats',
    bulkUpload: '/api/rest/admin/bulk-upload',
  },
};
```

---

## Build Output

### Frontend Build

```
frontend/build/
├── index.html              # Main HTML file
├── asset-manifest.json     # Asset mapping
├── static/
│   ├── css/
│   │   └── main.[hash].css # Compiled CSS
│   ├── js/
│   │   ├── main.[hash].js  # Main bundle
│   │   └── [chunk].[hash].js # Code-split chunks
│   └── media/
│       └── [assets]        # Images, fonts
└── favicon.ico
```

---

## Testing Structure

```
backend/
└── tests/
    ├── test_auth.py        # Authentication tests
    ├── test_users.py       # User management tests
    └── test_search.py      # Search functionality tests

frontend/
└── src/
    └── __tests__/
        ├── App.test.js
        └── components/
```

---

**Document Version:** 1.0
**Last Updated:** March 2026
**Developer:** info@expertaid.in
