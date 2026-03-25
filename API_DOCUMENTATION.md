# MySchool API Documentation
## For Flutter Mobile App Development

**Base URL:** `https://portal.myschoolct.com/api`

**Version:** 2.0.0

---

## Table of Contents
1. [Authentication](#1-authentication)
2. [User Management](#2-user-management)
3. [School Management](#3-school-management)
4. [Image Bank](#4-image-bank)
5. [Search](#5-search)
6. [Templates (Makers)](#6-templates-makers)
7. [Admin Operations](#7-admin-operations)
8. [Payments](#8-payments)
9. [Support](#9-support)

---

## Authentication Headers

For authenticated endpoints, include:
```
Authorization: Bearer <accessToken>
Content-Type: application/json
```

---

## 1. Authentication

### 1.1 Login
**POST** `/rest/auth/login`

**Request Body:**
```json
{
  "username": "user@example.com",
  "password": "Password@123",
  "schoolCode": "SCH001"  // Optional
}
```

**Response (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "message": "Login successful",
  "school": {
    "name": "ABC School",
    "code": "SCH001"
  }
}
```

**Error Responses:**
- `401`: Invalid credentials
- `403`: Account is disabled / School is inactive

---

### 1.2 Register
**POST** `/rest/auth/register`

**Request Body:**
```json
{
  "emailId": "user@example.com",
  "name": "John Doe",
  "password": "Password@123",  // Optional - auto-generated if not provided
  "mobileNumber": "9876543210",
  "userRole": "INDIVIDUAL",  // INDIVIDUAL, SCHOOL_ADMIN, TEACHER, STUDENT, PARENT
  "schoolCode": "SCH001",
  "address": "123 Main St",
  "city": "Mumbai",
  "state": "Maharashtra",
  "postalCode": "400001",
  // For School Admin
  "principalName": "Dr. Smith",
  // For Teacher
  "teacherCode": "TCH001",
  "subject": "Mathematics",
  // For Student
  "rollNumber": "101",
  "className": "Class 5",
  "sectionName": "A",
  "fatherName": "Robert Doe",
  "motherName": "Jane Doe"
}
```

**Response (200):**
```json
{
  "message": "Registration successful",
  "userId": "uuid-here",
  "emailSent": true,
  "school_code": "SCH001",
  "teacher_code": "TCH001"
}
```

---

### 1.3 Forgot Password
**GET** `/rest/auth/forgotPassword?email=user@example.com`

**Response (200):**
```json
{
  "message": "If the email exists, a reset code has been sent"
}
```

---

### 1.4 Confirm Password Reset
**POST** `/rest/auth/confirmPassword`

**Request Body:**
```json
{
  "email": "user@example.com",
  "code": "123456",
  "newPassword": "NewPassword@123"
}
```

**Response (200):**
```json
{
  "message": "Password updated successfully"
}
```

---

### 1.5 Change Password
**POST** `/rest/auth/changePassword`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "oldPassword": "OldPassword@123",
  "newPassword": "NewPassword@123"
}
```

---

### 1.6 Send OTP
**GET** `/rest/auth/sendOtp?mobileNumber=9876543210`

**Response (200):**
```json
{
  "message": "OTP sent successfully",
  "otpSent": true
}
```

---

### 1.7 Login via OTP
**POST** `/rest/auth/loginViaOtp`

**Request Body:**
```json
{
  "mobileNumber": "9876543210",
  "otp": "123456"
}
```

**Response (200):**
```json
{
  "accessToken": "...",
  "refreshToken": "...",
  "message": "Login successful"
}
```

---

### 1.8 Refresh Token
**POST** `/rest/auth/refreshToken`

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## 2. User Management

### 2.1 Get User Details
**GET** `/rest/users/getUserDetails`

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "TEACHER",
  "school_code": "SCH001",
  "teacher_code": "TCH001",
  "mobile_number": "9876543210",
  "city": "Mumbai",
  "state": "Maharashtra",
  "credits": 100,
  "disabled": false,
  "created_at": "2024-01-15T10:30:00Z"
}
```

---

### 2.2 Update User Details
**PATCH** `/rest/users/updateUserDetails`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "John Updated",
  "mobile_number": "9876543211",
  "city": "Delhi",
  "state": "Delhi"
}
```

---

### 2.3 Check Credits
**GET** `/rest/users/checkCredits`

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "credits": 100,
  "used": 25,
  "remaining": 75
}
```

---

### 2.4 List Users by Role
**GET** `/rest/users/listUsersByRole?role=TEACHER&schoolCode=SCH001&page=1&limit=20`

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "users": [
    {
      "id": "uuid",
      "name": "Teacher Name",
      "email": "teacher@school.com",
      "role": "TEACHER",
      "teacher_code": "TCH001",
      "school_code": "SCH001"
    }
  ],
  "total": 50,
  "page": 1,
  "pages": 3
}
```

---

### 2.5 Search Users
**GET** `/rest/users/search?query=john&role=STUDENT&schoolCode=SCH001`

**Headers:** `Authorization: Bearer <token>`

---

### 2.6 Disable/Enable Account
**POST** `/rest/users/disableAccount`

**Headers:** `Authorization: Bearer <token>` (Admin only)

**Request Body:**
```json
{
  "userId": "uuid-here",
  "disabled": true
}
```

---

## 3. School Management

### 3.1 Create School
**POST** `/rest/school/create`

**Headers:** `Authorization: Bearer <token>` (Super Admin only)

**Request Body:**
```json
{
  "name": "ABC International School",
  "email": "admin@abcschool.com",
  "principalName": "Dr. Smith",
  "mobileNumber": "9876543210",
  "address": "123 Education Lane",
  "city": "Mumbai",
  "state": "Maharashtra",
  "postalCode": "400001"
}
```

**Response (200):**
```json
{
  "message": "School created successfully",
  "schoolCode": "ABCIN001",
  "adminUserId": "uuid"
}
```

---

### 3.2 List Schools
**GET** `/rest/school/list?page=1&limit=20&search=abc`

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "schools": [
    {
      "code": "ABCIN001",
      "name": "ABC International School",
      "principal_name": "Dr. Smith",
      "city": "Mumbai",
      "state": "Maharashtra",
      "is_active": true,
      "teacher_count": 25,
      "student_count": 500,
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 100,
  "page": 1,
  "pages": 5
}
```

---

### 3.3 Get School Details
**GET** `/rest/school/{school_code}`

**Headers:** `Authorization: Bearer <token>`

---

### 3.4 Toggle School Status
**PATCH** `/rest/school/{school_code}/toggle-status`

**Headers:** `Authorization: Bearer <token>` (Super Admin only)

---

### 3.5 Get Active Schools (Public)
**GET** `/rest/school/public/active`

**Response (200):**
```json
{
  "schools": [
    {
      "code": "ABCIN001",
      "name": "ABC International School"
    }
  ]
}
```

---

## 4. Image Bank

### 4.1 Fetch Images
**POST** `/rest/images/fetch`

**Request Body:**
```json
{
  "folderPath": "ACADEMIC/CLASS/CLASS-1/MATHS",
  "imagesPerPage": 50,
  "page": 1
}
```

**Response (200):**
```json
{
  "list": {
    "0": "https://cdn.example.com/image1.jpg",
    "1": "https://cdn.example.com/image2.jpg"
  },
  "total": 150,
  "page": 1,
  "hasMore": true
}
```

---

### 4.2 Get PDF Thumbnail
**GET** `/rest/images/pdf-thumbnail?url=<encoded_url>&width=144&height=185`

**Response:** Image binary (PNG)

---

### 4.3 Get My Images
**GET** `/rest/images/myImages/get`

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "images": [
    {
      "id": "uuid",
      "url": "https://cdn.example.com/uploaded.jpg",
      "name": "My Upload",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

### 4.4 Get Favourite Images
**GET** `/rest/images/myImages/getFavourite`

**Headers:** `Authorization: Bearer <token>`

---

### 4.5 Save Image to My Images
**PUT** `/rest/images/myImages/save`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "imageUrl": "https://cdn.example.com/image.jpg",
  "name": "My Saved Image"
}
```

---

### 4.6 Add to Favourites
**PATCH** `/rest/images/myImages/addToFavourite`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "imageId": "uuid"
}
```

---

### 4.7 Download Image
**GET** `/rest/images/download?url=<encoded_url>&filename=image.jpg`

---

## 5. Search

### 5.1 Global Search
**GET** `/rest/search/global?query=mathematics&size=20`

**Response (200):**
```json
{
  "results": [
    {
      "type": "image",
      "title": "Mathematics Worksheet",
      "url": "https://cdn.example.com/math.jpg",
      "category": "ACADEMIC",
      "subcategory": "CLASS-1/MATHS"
    },
    {
      "type": "pdf",
      "title": "Math Textbook Chapter 1",
      "url": "https://cdn.example.com/math.pdf",
      "thumbnail": "https://cdn.example.com/math-thumb.png"
    }
  ],
  "total": 150
}
```

---

### 5.2 Search Suggestions
**GET** `/rest/search/suggestions?query=mat&limit=10`

**Response (200):**
```json
{
  "suggestions": [
    "Mathematics",
    "Math Worksheets",
    "Matching Games"
  ]
}
```

---

## 6. Templates (Makers)

### 6.1 List Templates
**GET** `/rest/templates/list?makerType=chart`

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "templates": [
    {
      "id": "uuid",
      "name": "My Chart Design",
      "makerType": "chart",
      "pageSize": "A4",
      "canvasBg": "#ffffff",
      "elements": [...],
      "isSystem": false,
      "created_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

### 6.2 Save Template
**POST** `/rest/templates/save`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "My Design",
  "makerType": "chart",
  "pageSize": "A4",
  "canvasBg": "#ffffff",
  "elements": [
    {
      "id": "text-123",
      "type": "text",
      "x": 100,
      "y": 100,
      "width": 200,
      "height": 50,
      "text": "Hello World",
      "fontSize": 24,
      "fontFamily": "Arial",
      "color": "#000000"
    },
    {
      "id": "image-456",
      "type": "image",
      "x": 300,
      "y": 200,
      "width": 150,
      "height": 150,
      "src": "data:image/png;base64,..."
    }
  ]
}
```

---

### 6.3 Delete Template
**DELETE** `/rest/templates/{template_id}`

**Headers:** `Authorization: Bearer <token>`

---

### 6.4 Get Template
**GET** `/rest/templates/{template_id}`

**Headers:** `Authorization: Bearer <token>`

---

## 7. Admin Operations

### 7.1 Dashboard Stats
**GET** `/rest/admin/dashboard-stats`

**Headers:** `Authorization: Bearer <token>` (Admin only)

**Response (200):**
```json
{
  "totalImages": 14584,
  "totalUsers": 165,
  "totalStudents": 59,
  "totalTeachers": 45,
  "totalSchools": 12,
  "activeUsers": 150,
  "disabledUsers": 15,
  "recentActivity": [
    {
      "action": "user_registered",
      "user": "john@example.com",
      "timestamp": "2024-01-15T10:30:00Z"
    }
  ],
  "userRole": "SUPER_ADMIN"
}
```

---

### 7.2 Bulk Upload Schools
**POST** `/rest/admin/bulk-upload/schools`

**Headers:** `Authorization: Bearer <token>` (Super Admin only)

**Content-Type:** `multipart/form-data`

**Form Data:**
- `file`: Excel file (.xlsx)

---

### 7.3 Bulk Upload Teachers
**POST** `/rest/admin/bulk-upload/teachers`

**Headers:** `Authorization: Bearer <token>` (Admin only)

---

### 7.4 Bulk Upload Students
**POST** `/rest/admin/bulk-upload/students`

**Headers:** `Authorization: Bearer <token>` (Admin only)

---

### 7.5 Get Bulk Upload Template
**GET** `/rest/admin/bulk-upload/template/{type}`

**Types:** `schools`, `teachers`, `students`

**Response:** Excel file download

---

### 7.6 Get Image Categories
**GET** `/rest/admin/categories`

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "categories": [
    {
      "name": "ACADEMIC",
      "subcategories": ["CLASS-1", "CLASS-2", "CLASS-3"]
    },
    {
      "name": "IMAGE BANK",
      "subcategories": ["ANIMALS", "BIRDS", "NATURE"]
    }
  ]
}
```

---

## 8. Payments

### 8.1 Get Subscription Plans
**GET** `/rest/payments/plans`

**Response (200):**
```json
{
  "plans": [
    {
      "id": "basic",
      "name": "Basic Plan",
      "price": 499,
      "currency": "INR",
      "credits": 100,
      "features": ["100 downloads", "Basic support"]
    },
    {
      "id": "premium",
      "name": "Premium Plan",
      "price": 999,
      "currency": "INR",
      "credits": 500,
      "features": ["500 downloads", "Priority support", "All makers"]
    }
  ]
}
```

---

### 8.2 Create Checkout Session
**POST** `/rest/payments/create-checkout-session`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "planId": "premium",
  "successUrl": "myapp://payment-success",
  "cancelUrl": "myapp://payment-cancel"
}
```

**Response (200):**
```json
{
  "sessionId": "cs_xxx",
  "url": "https://checkout.stripe.com/..."
}
```

---

### 8.3 Verify Payment Session
**POST** `/rest/payments/verify-session`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "sessionId": "cs_xxx"
}
```

---

### 8.4 Payment History
**GET** `/rest/payments/history`

**Headers:** `Authorization: Bearer <token>`

---

## 9. Support

### 9.1 Submit Support Request
**POST** `/rest/support/submit`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "subject": "Issue with login",
  "message": "I am unable to login to my account...",
  "category": "technical"
}
```

---

### 9.2 Get Support Requests
**GET** `/rest/support/requests`

**Headers:** `Authorization: Bearer <token>` (Admin only)

---

## Data Models

### User Roles
```dart
enum UserRole {
  SUPER_ADMIN,
  SCHOOL_ADMIN,
  TEACHER,
  STUDENT,
  PARENT,
  INDIVIDUAL,
  PUBLICATION
}
```

### Element Types (Makers)
```dart
enum ElementType {
  TEXT,
  IMAGE,
  RECTANGLE,
  CIRCLE,
  TRIANGLE,
  STAR,
  LINE,
  ARROW
}
```

### Page Sizes
```dart
const Map<String, Size> pageSizes = {
  'A3': Size(1191, 1684),
  'A4': Size(794, 1123),
  'A5': Size(559, 794),
  'Letter': Size(816, 1056),
  'Square': Size(800, 800),
};
```

---

## Error Handling

All errors follow this format:
```json
{
  "detail": "Error message here"
}
```

### Common HTTP Status Codes:
- `200`: Success
- `400`: Bad Request (validation error)
- `401`: Unauthorized (invalid/missing token)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `500`: Internal Server Error

---

## Rate Limiting

- **Authentication endpoints:** 10 requests/minute
- **Search endpoints:** 60 requests/minute
- **Image endpoints:** 100 requests/minute
- **Other endpoints:** 30 requests/minute

---

## Flutter Integration Tips

### 1. HTTP Client Setup
```dart
import 'package:dio/dio.dart';

class ApiClient {
  static const String baseUrl = 'https://portal.myschoolct.com/api';
  
  final Dio _dio = Dio(BaseOptions(
    baseUrl: baseUrl,
    connectTimeout: Duration(seconds: 30),
    receiveTimeout: Duration(seconds: 30),
  ));
  
  void setAuthToken(String token) {
    _dio.options.headers['Authorization'] = 'Bearer $token';
  }
}
```

### 2. Token Storage
```dart
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

final storage = FlutterSecureStorage();
await storage.write(key: 'accessToken', value: token);
```

### 3. Image Caching
```dart
import 'package:cached_network_image/cached_network_image.dart';

CachedNetworkImage(
  imageUrl: imageUrl,
  placeholder: (context, url) => CircularProgressIndicator(),
  errorWidget: (context, url, error) => Icon(Icons.error),
)
```

---

## Contact & Support

- **API Issues:** support@myschoolct.com
- **Documentation:** https://portal.myschoolct.com/api-docs

---

*Last Updated: January 2026*
