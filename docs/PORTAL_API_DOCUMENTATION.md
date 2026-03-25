# MySchool Portal - API Documentation

## Overview
The MySchool Portal backend is built with FastAPI (Python) and provides RESTful APIs for educational resource management, user authentication, and administrative functions.

**Base URL:** `https://portal.myschoolct.com/api/rest`

---

## Table of Contents
1. [Authentication APIs](#authentication-apis)
2. [User Management APIs](#user-management-apis)
3. [School Management APIs](#school-management-apis)
4. [Search APIs](#search-apis)
5. [Image Management APIs](#image-management-apis)
6. [Admin APIs](#admin-apis)
7. [Payment APIs](#payment-apis)
8. [Support APIs](#support-apis)
9. [Template APIs](#template-apis)

---

## Authentication APIs

### POST /auth/login
Authenticate user and get access token.

**Request Body:**
```json
{
  "username": "user@example.com",
  "password": "password123"
}
```

**Response (Success):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "role": "SCHOOL_ADMIN",
  "userId": "uuid-string",
  "name": "User Name",
  "email": "user@example.com"
}
```

**Response (Password Change Required):**
```json
{
  "challengeName": "NEW_PASSWORD_REQUIRED",
  "session": "session-token",
  "message": "Password change required"
}
```

### POST /auth/register
Register a new user (self-registration).

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass@123",
  "phone": "9876543210",
  "role": "TEACHER",
  "schoolCode": "SCH001"
}
```

### POST /auth/newPasswordChallenge
Complete password change challenge after first login.

**Request Body:**
```json
{
  "session": "session-token",
  "username": "user@example.com",
  "newPassword": "NewSecurePass@123"
}
```

### POST /auth/refreshToken
Refresh access token using refresh token.

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

### GET /auth/forgotPassword?email={email}
Initiate password reset process.

### POST /auth/confirmPassword
Confirm password reset with OTP.

**Request Body:**
```json
{
  "email": "user@example.com",
  "otp": "123456",
  "newPassword": "NewPassword@123"
}
```

### POST /auth/changePassword
Change password for logged-in user.

**Headers:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "currentPassword": "OldPass@123",
  "newPassword": "NewPass@123"
}
```

### GET /auth/sendOtp?email={email}
Send OTP for login verification.

### POST /auth/loginViaOtp
Login using OTP instead of password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

---

## User Management APIs

### GET /users/getUserDetails
Get current user's details.

**Headers:** `Authorization: Bearer {token}`

### PATCH /users/updateUserDetails
Update current user's profile.

**Headers:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "name": "Updated Name",
  "phone": "9876543210"
}
```

### GET /users/listUsersByRole
List users by role with pagination.

**Headers:** `Authorization: Bearer {token}`

**Query Parameters:**
- `role` (required): SCHOOL_ADMIN, TEACHER, STUDENT
- `limit` (optional): Number of results (default: 10)
- `lastUserId` (optional): For pagination

### GET /users/search?query={searchTerm}
Search users by name or email.

**Headers:** `Authorization: Bearer {token}`

### POST /users/add
Add a new user (Admin only).

**Headers:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "name": "New User",
  "email": "newuser@example.com",
  "role": "TEACHER",
  "schoolCode": "SCH001"
}
```

### PUT /users/{user_id}
Update user details by ID.

**Headers:** `Authorization: Bearer {token}`

### DELETE /users/deleteUser/{user_id}
Delete a user.

**Headers:** `Authorization: Bearer {token}`

### PATCH /users/updateCredits
Update user credits (Admin only).

**Headers:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "userId": "user-uuid",
  "credits": 100,
  "operation": "add"
}
```

### GET /users/checkCredits
Check current user's credit balance.

**Headers:** `Authorization: Bearer {token}`

### POST /users/useCredits
Deduct credits for download/print.

**Headers:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "amount": 1,
  "action": "download",
  "imageId": "image-uuid"
}
```

### GET /users/subscription-history
Get user's subscription and payment history.

**Headers:** `Authorization: Bearer {token}`

---

## School Management APIs

### POST /schools/create
Create a new school (Super Admin only).

**Headers:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "name": "ABC School",
  "code": "ABC001",
  "address": "123 Main St",
  "city": "Mumbai",
  "state": "Maharashtra",
  "adminEmail": "admin@abcschool.com",
  "adminName": "School Admin"
}
```

### GET /schools/list
List all schools with pagination.

**Headers:** `Authorization: Bearer {token}`

### GET /schools/public/active
Get list of active schools (public endpoint for registration).

### GET /schools/{school_code}
Get school details by code.

**Headers:** `Authorization: Bearer {token}`

### PATCH /schools/{school_code}/toggle-status
Enable/disable a school.

**Headers:** `Authorization: Bearer {token}`

---

## Search APIs

### GET /search/global
Global search across all resources.

**Query Parameters:**
- `query` (required): Search term
- `size` (optional): Number of results (default: 20)

**Response:**
```json
{
  "total": 45,
  "results": [
    {
      "path": "https://storage.url/image.jpg",
      "title": "Resource Title",
      "category": "Academic",
      "thumbnail": "https://storage.url/thumb.jpg",
      "type": "image",
      "tags": ["maths", "class-5"]
    }
  ]
}
```

### GET /search/suggestions?query={term}
Get search suggestions/autocomplete.

---

## Image Management APIs

### GET /images/pdf-thumbnail
Generate thumbnail for PDF file.

**Query Parameters:**
- `url` (required): PDF file URL
- `width` (optional): Thumbnail width
- `height` (optional): Thumbnail height

### GET /images/proxy?url={imageUrl}
Proxy image requests for CORS handling.

### POST /images/fetch
Fetch images from storage by path.

**Request Body:**
```json
{
  "paths": ["folder1/", "folder2/image.jpg"]
}
```

### GET /images/myImages/get
Get user's saved images.

**Headers:** `Authorization: Bearer {token}`

### GET /images/myImages/getFavourite
Get user's favorite images.

**Headers:** `Authorization: Bearer {token}`

### PUT /images/myImages/save
Save image to user's collection.

**Headers:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "imageUrl": "https://storage.url/image.jpg",
  "title": "My Image",
  "category": "Academic"
}
```

### PATCH /images/myImages/addToFavourite
Add image to favorites.

**Headers:** `Authorization: Bearer {token}`

### PATCH /images/myImages/removeFromFavourite
Remove image from favorites.

**Headers:** `Authorization: Bearer {token}`

### DELETE /images/myImages/delete
Delete image from user's collection.

**Headers:** `Authorization: Bearer {token}`

### GET /images/download
Download image with credit deduction.

**Headers:** `Authorization: Bearer {token}`

**Query Parameters:**
- `url` (required): Image URL
- `format` (optional): jpg, png, pdf

---

## Admin APIs

### POST /admin/bulk-upload/schools
Bulk upload schools from Excel file.

**Headers:** `Authorization: Bearer {token}`
**Content-Type:** `multipart/form-data`

### POST /admin/bulk-upload/teachers
Bulk upload teachers from Excel file.

**Headers:** `Authorization: Bearer {token}`
**Content-Type:** `multipart/form-data`

### POST /admin/bulk-upload/students
Bulk upload students from Excel file.

**Headers:** `Authorization: Bearer {token}`
**Content-Type:** `multipart/form-data`

### GET /admin/bulk-upload/template/{type}
Download bulk upload template.

**Parameters:**
- `type`: schools, teachers, students

### GET /admin/dashboard-stats
Get dashboard statistics.

**Headers:** `Authorization: Bearer {token}`

**Response:**
```json
{
  "totalSchools": 50,
  "totalTeachers": 200,
  "totalStudents": 5000,
  "activeSubscriptions": 45,
  "todaysDownloads": 120
}
```

### GET /admin/user-logs
Get user activity logs.

**Headers:** `Authorization: Bearer {token}`

### GET /admin/user-logs/stats
Get user log statistics.

**Headers:** `Authorization: Bearer {token}`

### GET /admin/categories
Get image categories.

**Headers:** `Authorization: Bearer {token}`

### POST /admin/upload-image
Upload new image to storage.

**Headers:** `Authorization: Bearer {token}`
**Content-Type:** `multipart/form-data`

### GET /admin/pending-images
Get images pending approval.

**Headers:** `Authorization: Bearer {token}`

### POST /admin/approve-image/{image_id}
Approve uploaded image.

**Headers:** `Authorization: Bearer {token}`

### POST /admin/reject-image/{image_id}
Reject uploaded image.

**Headers:** `Authorization: Bearer {token}`

---

## Payment APIs

### GET /payment/plans
Get available subscription plans.

### POST /payment/razorpay/create-order
Create Razorpay payment order.

**Headers:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "planId": "plan-uuid",
  "amount": 999
}
```

### POST /payment/razorpay/verify-payment
Verify Razorpay payment after completion.

**Headers:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "razorpay_order_id": "order_xxx",
  "razorpay_payment_id": "pay_xxx",
  "razorpay_signature": "signature"
}
```

### POST /payment/razorpay/webhook
Razorpay webhook endpoint for payment events.

### GET /payment/history
Get user's payment history.

**Headers:** `Authorization: Bearer {token}`

### GET /payment/user/credits
Get user's current credit balance.

**Headers:** `Authorization: Bearer {token}`

---

## Support APIs

### POST /support/submit
Submit support ticket.

**Headers:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "subject": "Issue Subject",
  "message": "Detailed description of the issue",
  "category": "technical"
}
```

### GET /support/requests
Get user's support tickets.

**Headers:** `Authorization: Bearer {token}`

### PATCH /support/resolve/{ticket_id}
Resolve support ticket (Admin only).

**Headers:** `Authorization: Bearer {token}`

---

## Template APIs

### GET /templates/list
Get user's saved templates.

**Headers:** `Authorization: Bearer {token}`

### POST /templates/save
Save a new template.

**Headers:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "name": "My Template",
  "type": "certificate",
  "content": {}
}
```

### DELETE /templates/{template_id}
Delete a template.

**Headers:** `Authorization: Bearer {token}`

### GET /templates/{template_id}
Get template by ID.

**Headers:** `Authorization: Bearer {token}`

---

## Error Responses

All APIs return standard error responses:

```json
{
  "detail": "Error message description"
}
```

**HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `422` - Validation Error
- `500` - Internal Server Error

---

## Rate Limiting

API endpoints are rate-limited to prevent abuse:
- Authentication endpoints: 10 requests/minute
- Search endpoints: 60 requests/minute
- Other endpoints: 30 requests/minute

---

## Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

Tokens expire after 24 hours. Use the refresh token endpoint to get a new access token.

---

**Document Version:** 1.0
**Last Updated:** March 2026
**Developer:** info@expertaid.in
