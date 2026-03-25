# MySchool Portal - Product Requirements

## Overview
School management portal built with React frontend, FastAPI backend, and MongoDB.

## Core Features
- Multi-role auth (Super Admin, Admin, Teacher, Student)
- School/Teacher/Student management
- Academic resources with image bank
- PDF thumbnails, Telugu support
- Digital Board for classroom
- Lesson Plans integration

## Tech Stack
- Frontend: React, MUI, Redux
- Backend: FastAPI, MongoDB
- Digital Board: Fabric.js, pdfjs-dist
- Screen recording: MediaRecorder API

## API Routes
- /api/rest/auth/* - Authentication
- /api/rest/users/* - User management
- /api/rest/images/* - Image resources
- /api/rest/search/* - Search
- /api/rest/digital-boards/* - Digital board
- /api/rest/lesson-plans/* - Lesson plans

## Key Files
- /backend/server.py - Main API
- /frontend/src/components/digitalBoard/DigitalBoard.jsx - Digital whiteboard
- /frontend/src/components/digitalBoard/DigitalBoard.css - Board styling
- /frontend/src/Routes/routes.jsx - Routing

## Repositories
1. ekodecrux/Myschoollocalnew - Full history
2. ekodecrux/Myschoollocallatest - Fresh commit (author: info@expertaid.in)
3. MySchool-Code/Myschool-Updated-Code - Fresh commit (author: info@expertaid.in)

## Production
- Server: Hostinger VPS (88.222.244.84)
- Backend: FastAPI (8001)
- Frontend: React (Nginx)
- DB: MongoDB

## Digital Board Features (Implemented Dec 2025)
- Top toolbar: New, Save, Open, Export, Undo/Redo, Zoom, Grid, Fullscreen, Record, Image Upload, PDF Import
- Left toolbar: Select, Pan, Pen, Highlighter, Eraser, Shapes (rect, circle, triangle, line, arrow), Text, Sticky Note, Colors, Delete
- Right toolbar: Brush size slider
- PDF import: Uses pdfjs-dist to import PDF pages as images
- Viewport-centered object placement
- Fixed layout to work within auth layout with fixed header

## Pending/Future Tasks
- Lesson Plans display fix (frontend issue)
- PPT import (currently shows message to convert to PDF)
- Real-time collaboration
- Screen recording enhancement
- Automated deployment script

## Updated
March 2026 - Digital Board toolbar fixes and PDF import feature
