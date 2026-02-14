# MySchool Portal

Educational portal application for schools, teachers, and students.

## Production
- **URL**: https://portal.myschoolct.com
- **Hosted on**: Hostinger VPS

## Features
- Multi-role authentication (Super Admin, School Admin, Teacher, Student)
- Image Bank with multi-level filtering
- Academic content organization
- Subscription and credit management
- Maker tools for educational materials

## Project Structure
```
├── backend/          # FastAPI Python backend
│   ├── server.py     # Main application
│   ├── models/       # Pydantic models
│   ├── routes/       # API routes
│   ├── services/     # Business logic
│   └── utils/        # Utilities
│
├── frontend/         # React frontend
│   ├── src/
│   │   ├── components/
│   │   ├── redux/
│   │   └── ...
│   └── public/
│
└── docs/             # Documentation
```

## Setup

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your credentials
uvicorn server:app --host 0.0.0.0 --port 8003
```

### Frontend
```bash
cd frontend
yarn install
cp .env.example .env
# Edit .env with your backend URL
yarn start
```

## Tech Stack
- **Backend**: FastAPI, MongoDB, Cloudflare R2
- **Frontend**: React, Redux, MUI
- **Payments**: Razorpay
