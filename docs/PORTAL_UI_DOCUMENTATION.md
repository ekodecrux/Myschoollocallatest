# MySchool Portal - UI Functionality Documentation

## Overview
The MySchool Portal is a comprehensive educational resource management platform built with React.js. It provides different interfaces for various user roles including Super Admin, School Admin, Teachers, and Students.

---

## Table of Contents
1. [Public Pages](#public-pages)
2. [Authentication](#authentication)
3. [Dashboard Views](#dashboard-views)
4. [Academic Resources](#academic-resources)
5. [Maker Tools](#maker-tools)
6. [User Management](#user-management)
7. [Settings & Profile](#settings--profile)

---

## Public Pages

### Home Page (`/`)
The landing page showcasing the platform's features.

**Components:**
- Hero section with search functionality
- Featured categories carousel
- Quick access to Academic, Edutainment, and Maker sections
- Subscription plans overview
- Footer with links to policies and support

**Features:**
- Global search bar for all resources
- Category-based navigation
- Responsive design for mobile devices

### Search Results (`/views/result`)
Displays search results with filtering options.

**Features:**
- Grid view of images and resources
- Filter by category, format, and class
- Add to favorites functionality
- Download and print options
- Pagination support

---

## Authentication

### Login Dialog
**Path:** Accessible from header "Sign In" button

**Features:**
- Email/password login
- Login via OTP option
- Google OAuth integration
- "Remember me" functionality
- Forgot password flow

**Password Requirements:**
- Minimum 8 characters
- At least one uppercase letter
- At least one number
- At least one special character

### Registration Dialog
**Path:** Accessible from header "Sign Up" button

**Features:**
- Role selection (Teacher/Student)
- School selection dropdown
- Email verification
- Terms and conditions acceptance
- First-time password change prompt

### Password Change Dialog
Appears when `require_password_change` flag is true.

**Features:**
- Current password validation
- New password strength indicator
- Confirm password matching
- Password visibility toggle

---

## Dashboard Views

### Super Admin Dashboard (`/auth/dashboard`)
**Access:** Super Admin only

**Features:**
- Total schools, teachers, students count
- Today's downloads statistics
- Recent activity log
- Quick actions for user management
- Subscription statistics

**Widgets:**
- Schools overview card
- User statistics chart
- Revenue analytics
- System health status

### School Admin Dashboard (`/auth/dashboard`)
**Access:** School Admin

**Features:**
- School-specific statistics
- Teacher and student management
- Bulk upload functionality
- Subscription status
- Credit balance display

### Teacher Dashboard (`/auth/dashboard`)
**Access:** Teachers

**Features:**
- My Images collection
- Favorite resources
- Download history
- Credit balance
- Class-wise resources

### Student Dashboard (`/auth/dashboard`)
**Access:** Students

**Features:**
- My saved images
- Favorite resources
- Download history
- Credit balance

---

## Academic Resources

### Academic Section (`/views/academic`)
Main academic resources browser.

**Navigation Structure:**
```
Academic
├── Class 1-10
│   ├── English
│   ├── Hindi
│   ├── Telugu
│   ├── EVS/Science
│   ├── Maths
│   ├── GK
│   ├── Computer
│   ├── Art
│   ├── Craft
│   ├── Stories
│   └── Charts
├── Nursery/LKG/UKG
└── Image Bank
    ├── Animals
    ├── Birds
    ├── Flowers
    ├── Fruits
    ├── Vegetables
    ├── Plants
    ├── Insects
    └── Professions
```

**Features:**
- Multi-level category navigation
- Breadcrumb trail
- Grid/list view toggle
- Sorting options (A-Z, Recent, Popular)
- Bulk selection for download

### Image Viewer (`/views/academic/imageRenderer`)
Full-screen image preview with actions.

**Features:**
- Zoom in/out controls
- Pan functionality
- Download button (with credit check)
- Print functionality
- Add to favorites
- Share option
- Previous/Next navigation
- Image metadata display

### Selected Images Tray
Bottom drawer showing selected images.

**Features:**
- Thumbnail preview
- Remove individual items
- Clear all selection
- Bulk download
- Total credit cost display

---

## Edutainment Section

### Comics (`/views/sections/comics`)
Educational comics and graphic content.

### Rhymes (`/views/sections/rhymes`)
Animated rhymes and nursery content.

### Stories (`/views/sections/pictorial-stories`)
Picture stories with audio narration.

### Puzzles & Riddles (`/views/sections/puzzles-riddles`)
Interactive puzzles and brain teasers.

---

## Maker Tools

### Certificate Maker (`/views/maker/certificate`)
Create custom certificates.

**Features:**
- Template selection
- Text customization
- Image upload for logos
- Student name mail merge
- Batch generation
- Download as PDF/Image

### ID Card Maker (`/views/maker/idcard`)
Design school ID cards.

**Features:**
- Front/back design
- Photo upload
- QR code generation
- Bulk print layout
- Template library

### Flash Card Maker (`/views/maker/flashcard`)
Create educational flashcards.

**Features:**
- Front/back content
- Image support
- Category organization
- Print-ready format
- Share functionality

### Greeting Card Maker (`/views/maker/greetingcard`)
Design greeting cards.

**Features:**
- Occasion templates
- Custom messages
- Image upload
- Download/Share options

---

## User Management

### Schools List (`/auth/school`)
**Access:** Super Admin

**Features:**
- Schools data table
- Search and filter
- Add new school
- Edit school details
- Enable/disable school
- View school admin
- Export to Excel

**Table Columns:**
- School Name
- School Code
- City/State
- Admin Name
- Status
- Actions

### Teachers List (`/auth/teachers`)
**Access:** Super Admin, School Admin

**Features:**
- Teachers data table
- Search by name/email
- Add single teacher
- Bulk upload from Excel
- Edit teacher details
- Reset password
- View activity log

**Table Columns:**
- Name
- Email
- Phone
- School
- Status
- Credits
- Actions

### Students List (`/auth/students`)
**Access:** Super Admin, School Admin, Teacher

**Features:**
- Students data table
- Search by name/roll number
- Add single student
- Bulk upload from Excel
- Edit student details
- View download history

**Table Columns:**
- Name
- Roll Number
- Email
- Class
- School
- Credits
- Actions

### Bulk Upload
**Access:** Admin roles

**Steps:**
1. Download Excel template
2. Fill in user details
3. Upload file
4. Preview and validate
5. Confirm upload
6. View results

**Validation:**
- Email format validation
- Duplicate email check
- Required fields check
- Name format (no special characters)

---

## Settings & Profile

### User Profile (`/auth/profile`)
**Features:**
- View/edit personal information
- Change password
- View subscription status
- Credit balance display
- Download history

### Subscription Management (`/auth/subscription`)
**Features:**
- Current plan details
- Plan comparison
- Upgrade/renew options
- Payment history
- Invoice download

### Credit Purchase
**Features:**
- Credit packages display
- Razorpay payment integration
- Purchase history
- Auto-renewal settings

---

## Common UI Components

### Header Navigation
- Logo with home link
- Main navigation menu
- Search bar
- User menu (when logged in)
- Sign In/Sign Up buttons

### Footer
- About links
- Policy links
- Contact information
- Social media links
- Copyright notice

### Sidebar (Dashboard)
- Role-based menu items
- Collapsible on mobile
- Active state indicators
- Notification badges

### Data Tables
- Sortable columns
- Pagination
- Row selection
- Export options
- Responsive design

### Dialogs/Modals
- Login/Register
- Image preview
- Confirmation dialogs
- Form dialogs
- Loading states

### Notifications
- Toast messages (success/error)
- In-app notifications
- Email notifications

---

## Responsive Design

### Breakpoints
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

### Mobile-specific Features
- Hamburger menu
- Swipe gestures
- Touch-optimized controls
- Simplified navigation

---

## Accessibility Features

- Keyboard navigation support
- Screen reader compatibility
- High contrast mode
- Focus indicators
- Alt text for images
- ARIA labels

---

## Browser Support

- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Edge (latest 2 versions)

**Note:** Internet Explorer is not supported.

---

**Document Version:** 1.0
**Last Updated:** March 2026
**Developer:** info@expertaid.in
