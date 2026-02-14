# MySchool Portal - Product Requirements Document

## Original Problem Statement
Educational portal application for schools, teachers, and students with image management, subscription plans, and administrative features. The application provides:
- Multi-role authentication (Super Admin, School Admin, Teacher, Student)
- Image Bank with multi-level filtering (categories and sub-categories)
- Academic content organization by class/grade
- Subscription and credit management
- Maker tools for creating educational materials

## Core Architecture
- **Frontend**: React with MUI, Redux for state management
- **Backend**: FastAPI (Python) with MongoDB
- **Storage**: Cloudflare R2 for images
- **Production**: Hosted on Hostinger VPS at portal.myschoolct.com

---

## What's Been Implemented

### January 25, 2026 - Dashboard Bug Fix Session (6 Issues from Pending issues_Myschool_25Dec.docx)

#### Issue 1 (P1): Sign Out Displaying Twice - FIXED
- Removed duplicate "Logout" MenuItem from profile dropdown in Home.jsx
- Users now see only "Dashboard" in dropdown; "Sign Out" button remains visible beside profile icon

#### Issue 2 (P1): One Click Resource Center Sub-category Blank Page - VERIFIED WORKING
- Tested multiple paths: /views/sections/comics, /views/sections/rhymes, /views/sections/rhymes/nursery
- All paths load correctly with filter options and content

#### Issue 3 (P2): Micro Scheduler UI Issues - FIXED
- Added CloseIcon (X) to all dialogs (Add Subject, Edit Period, Save Template)
- Save button already visible and working in toolbar

#### Issue 4 (P2): Character Limits for Period/Subject Titles - FIXED
- Subject Name: 30 character limit with helper text "0/30 characters"
- Period Name: 20 character limit with helper text "0/20 characters"
- Short Name: Already had 4 character limit

#### Issue 5 (P2): Subject Deletion Without Confirmation - FIXED
- Added confirmation dialog when clicking delete on a subject
- Shows: "Are you sure you want to delete the subject '[name]'? This action cannot be undone."
- Cancel and Delete buttons with proper styling

#### Issue 6 (P2): Month View Only Showing One Subject - FIXED
- Added getSubjectsForDate() function to return ALL subjects for a date
- Month view now displays up to 4 subjects per cell as colored chips
- Shows "+N" indicator if more than 4 subjects scheduled

### January 20, 2026 - Major Bug Fix Session (17 Issues)

#### Form Validation & Registration
- **Issue 101**: Section field now accepts spaces and alphanumerics (not just alphabets)
- **Issue 102**: Removed `admin_name` from school bulk upload template
- **Issue 112-113**: Student bulk upload - made `roll_number` and `teacher_code` mandatory, removed city/state/address from info

#### Admin Panel - School List
- **Issue 103**: Principal name now shows correctly (added to backend response)
- **Issue 104**: Fixed "NaN" display - now shows "-" for empty values
- **Issue 105**: School bulk upload verified working
- **Issue 106**: Address and City/State show full text on mouseover (Tooltip)
- **Issue 107**: City/State filter works (backend search includes these fields)

#### Admin Panel - All Lists (School/Teacher/Student)
- **Issues 108-110**: Increased Actions column width from 230 to 260 for full "Manage Credits" text
- **Issue 111**: School filter dropdown now fetches up to 500 schools, displays "School Name (School Code)"

#### Login & Authentication
- **Issue 114**: Remember Me checkbox now saves email to localStorage and restores on return

#### Makers Module
- **Issue 115**: Save/Print/Load button text now has visible color on hover

#### Resource Center & Image Bank
- **Issue 116**: Fixed ONE CLICK RESOURCE CENTRE sub-filters (added subject/book_type path support)
- **Issue 117**: Blue filter bar "Select a subject..." message no longer shows on Image Bank pages

#### Edit Functionality (P1)
- Edit Teacher: Form pre-populates with user data, title shows "Edit Teacher", email disabled
- Edit Student: Form pre-populates with all student data, title shows "Edit Student", email disabled

#### Sorting (P1)
- All columns in Schools, Teachers, Students tables are now sortable (except Actions)

---

## Test Results (January 25, 2026)

All 6 issues from Pending issues_Myschool_25Dec.docx verified:
- Issue 1 (Sign Out duplicate): ✅ PASS - Only "Dashboard" in dropdown
- Issue 2 (Resource Center blank): ✅ PASS - Pages load correctly
- Issue 3 (Micro Scheduler dialogs): ✅ PASS - Close icons added
- Issue 4 (Character limits): ✅ PASS - 30/20 char limits enforced
- Issue 5 (Delete confirmation): ✅ PASS - Confirmation dialog appears
- Issue 6 (Month view subjects): ✅ PASS - Multiple subjects display

---

## Prioritized Backlog

### P0 (Critical)
- None currently

### P1 (High Priority)
- All P1 issues completed

### P2 (Medium Priority)
- Refactor monolithic server.py into modular routers
- Delete unused ImageBankFilter.jsx component (already deleted)
- Demote secondary Super Admin account

### Future Enhancements
- Automated deployment script with URL validation
- Add comprehensive test coverage
- Performance optimization
- Audit logging for edit operations

---

## Technical Notes

### Deployment Process
1. Update `/app/frontend/.env` with `REACT_APP_BACKEND_URL=https://portal.myschoolct.com`
2. Run `yarn build` in frontend directory
3. Deploy with `sshpass -p 'password' rsync -avz --delete /app/frontend/build/ root@88.222.244.84:/var/www/portal.myschoolct/ -e "ssh -o StrictHostKeyChecking=no"`

### Credentials
- Production Server SSH: `ssh root@88.222.244.84` (Password: `Yourkpo@202526`)
- Super Admin: `jagrajsinghji99@gmail.com` / `Pass@1234`

### 3rd Party Integrations
- Groq: LLM for chatbot translation
- Razorpay: Payment gateway
- Cloudflare R2: Image storage

### Key Files Modified (Jan 25, 2026)
- `/app/frontend/src/components/homeScreen/Home.jsx`: Removed duplicate Logout from profile dropdown
- `/app/frontend/src/components/makers/microScheduler/MicroScheduler.jsx`: Added CloseIcon, confirmation dialog, character limits, multiple subjects in month view

### Key Files Modified (Jan 20, 2026)
- `/app/frontend/src/utils/fieldValidation.js`: Section field validation pattern
- `/app/frontend/src/components/auth/views/school/School.jsx`: Bulk upload template
- `/app/frontend/src/components/auth/views/school/constants.jsx`: Tooltip for Address/City, column widths
- `/app/frontend/src/components/auth/views/teacher/constant.jsx`: Sortable columns, Actions width
- `/app/frontend/src/components/auth/views/student/constant.jsx`: Sortable columns, Actions width
- `/app/frontend/src/components/auth/views/student/Student.jsx`: School filter, bulk upload
- `/app/frontend/src/components/auth/views/teacher/addNewTeacher/AddNewTeacher.jsx`: Edit mode
- `/app/frontend/src/components/auth/views/student/addNewStudent/AddNewStudent.jsx`: Edit mode
- `/app/frontend/src/components/auth/login/Login.jsx`: Remember Me functionality
- `/app/frontend/src/components/makers/shared/UnifiedMaker.jsx`: Button hover colors
- `/app/frontend/src/components/makers/chartMaker/CanvaEditor.jsx`: Button hover colors
- `/app/frontend/src/uicomponent/filter/AcademicFilter.jsx`: Hide filter hint on Image Bank
- `/app/backend/server.py`: Principal name, NaN handling, ONE CLICK paths
