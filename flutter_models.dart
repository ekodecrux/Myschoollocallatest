// MySchool API - Flutter/Dart Models
// Generated for mobile app development

import 'package:json_annotation/json_annotation.dart';

part 'models.g.dart';

// ==================== ENUMS ====================

enum UserRole {
  @JsonValue('SUPER_ADMIN')
  superAdmin,
  @JsonValue('SCHOOL_ADMIN')
  schoolAdmin,
  @JsonValue('TEACHER')
  teacher,
  @JsonValue('STUDENT')
  student,
  @JsonValue('PARENT')
  parent,
  @JsonValue('INDIVIDUAL')
  individual,
  @JsonValue('PUBLICATION')
  publication,
}

enum ElementType {
  @JsonValue('text')
  text,
  @JsonValue('image')
  image,
  @JsonValue('rectangle')
  rectangle,
  @JsonValue('circle')
  circle,
  @JsonValue('triangle')
  triangle,
  @JsonValue('star')
  star,
  @JsonValue('line')
  line,
  @JsonValue('arrow')
  arrow,
}

// ==================== AUTH MODELS ====================

@JsonSerializable()
class LoginRequest {
  final String username;
  final String password;
  @JsonKey(name: 'schoolCode')
  final String? schoolCode;

  LoginRequest({
    required this.username,
    required this.password,
    this.schoolCode,
  });

  factory LoginRequest.fromJson(Map<String, dynamic> json) => _$LoginRequestFromJson(json);
  Map<String, dynamic> toJson() => _$LoginRequestToJson(this);
}

@JsonSerializable()
class LoginResponse {
  final String accessToken;
  final String refreshToken;
  final String message;
  final SchoolInfo? school;

  LoginResponse({
    required this.accessToken,
    required this.refreshToken,
    required this.message,
    this.school,
  });

  factory LoginResponse.fromJson(Map<String, dynamic> json) => _$LoginResponseFromJson(json);
  Map<String, dynamic> toJson() => _$LoginResponseToJson(this);
}

@JsonSerializable()
class SchoolInfo {
  final String name;
  final String code;

  SchoolInfo({required this.name, required this.code});

  factory SchoolInfo.fromJson(Map<String, dynamic> json) => _$SchoolInfoFromJson(json);
  Map<String, dynamic> toJson() => _$SchoolInfoToJson(this);
}

@JsonSerializable()
class RegisterRequest {
  @JsonKey(name: 'emailId')
  final String email;
  final String name;
  final String? password;
  @JsonKey(name: 'mobileNumber')
  final String? mobileNumber;
  @JsonKey(name: 'userRole')
  final String userRole;
  @JsonKey(name: 'schoolCode')
  final String? schoolCode;
  final String? address;
  final String? city;
  final String? state;
  @JsonKey(name: 'postalCode')
  final String? postalCode;
  @JsonKey(name: 'principalName')
  final String? principalName;
  @JsonKey(name: 'teacherCode')
  final String? teacherCode;
  final String? subject;
  @JsonKey(name: 'rollNumber')
  final String? rollNumber;
  @JsonKey(name: 'className')
  final String? className;
  @JsonKey(name: 'sectionName')
  final String? sectionName;
  @JsonKey(name: 'fatherName')
  final String? fatherName;
  @JsonKey(name: 'motherName')
  final String? motherName;

  RegisterRequest({
    required this.email,
    required this.name,
    this.password,
    this.mobileNumber,
    this.userRole = 'INDIVIDUAL',
    this.schoolCode,
    this.address,
    this.city,
    this.state,
    this.postalCode,
    this.principalName,
    this.teacherCode,
    this.subject,
    this.rollNumber,
    this.className,
    this.sectionName,
    this.fatherName,
    this.motherName,
  });

  factory RegisterRequest.fromJson(Map<String, dynamic> json) => _$RegisterRequestFromJson(json);
  Map<String, dynamic> toJson() => _$RegisterRequestToJson(this);
}

@JsonSerializable()
class RegisterResponse {
  final String message;
  final String userId;
  final bool emailSent;
  @JsonKey(name: 'school_code')
  final String? schoolCode;
  @JsonKey(name: 'teacher_code')
  final String? teacherCode;

  RegisterResponse({
    required this.message,
    required this.userId,
    required this.emailSent,
    this.schoolCode,
    this.teacherCode,
  });

  factory RegisterResponse.fromJson(Map<String, dynamic> json) => _$RegisterResponseFromJson(json);
  Map<String, dynamic> toJson() => _$RegisterResponseToJson(this);
}

// ==================== USER MODELS ====================

@JsonSerializable()
class User {
  final String id;
  final String email;
  final String name;
  final String role;
  @JsonKey(name: 'school_code')
  final String? schoolCode;
  @JsonKey(name: 'teacher_code')
  final String? teacherCode;
  @JsonKey(name: 'mobile_number')
  final String? mobileNumber;
  final String? city;
  final String? state;
  final String? address;
  final int? credits;
  final bool? disabled;
  @JsonKey(name: 'created_at')
  final String? createdAt;
  // Student fields
  @JsonKey(name: 'roll_number')
  final String? rollNumber;
  @JsonKey(name: 'class_name')
  final String? className;
  @JsonKey(name: 'section_name')
  final String? sectionName;
  @JsonKey(name: 'father_name')
  final String? fatherName;
  @JsonKey(name: 'mother_name')
  final String? motherName;

  User({
    required this.id,
    required this.email,
    required this.name,
    required this.role,
    this.schoolCode,
    this.teacherCode,
    this.mobileNumber,
    this.city,
    this.state,
    this.address,
    this.credits,
    this.disabled,
    this.createdAt,
    this.rollNumber,
    this.className,
    this.sectionName,
    this.fatherName,
    this.motherName,
  });

  factory User.fromJson(Map<String, dynamic> json) => _$UserFromJson(json);
  Map<String, dynamic> toJson() => _$UserToJson(this);
}

@JsonSerializable()
class UserListResponse {
  final List<User> users;
  final int total;
  final int page;
  final int pages;

  UserListResponse({
    required this.users,
    required this.total,
    required this.page,
    required this.pages,
  });

  factory UserListResponse.fromJson(Map<String, dynamic> json) => _$UserListResponseFromJson(json);
  Map<String, dynamic> toJson() => _$UserListResponseToJson(this);
}

@JsonSerializable()
class CreditsResponse {
  final int credits;
  final int used;
  final int remaining;

  CreditsResponse({
    required this.credits,
    required this.used,
    required this.remaining,
  });

  factory CreditsResponse.fromJson(Map<String, dynamic> json) => _$CreditsResponseFromJson(json);
  Map<String, dynamic> toJson() => _$CreditsResponseToJson(this);
}

// ==================== SCHOOL MODELS ====================

@JsonSerializable()
class School {
  final String code;
  final String name;
  @JsonKey(name: 'principal_name')
  final String? principalName;
  final String? city;
  final String? state;
  final String? address;
  @JsonKey(name: 'is_active')
  final bool? isActive;
  @JsonKey(name: 'teacher_count')
  final int? teacherCount;
  @JsonKey(name: 'student_count')
  final int? studentCount;
  @JsonKey(name: 'created_at')
  final String? createdAt;

  School({
    required this.code,
    required this.name,
    this.principalName,
    this.city,
    this.state,
    this.address,
    this.isActive,
    this.teacherCount,
    this.studentCount,
    this.createdAt,
  });

  factory School.fromJson(Map<String, dynamic> json) => _$SchoolFromJson(json);
  Map<String, dynamic> toJson() => _$SchoolToJson(this);
}

@JsonSerializable()
class SchoolListResponse {
  final List<School> schools;
  final int total;
  final int page;
  final int pages;

  SchoolListResponse({
    required this.schools,
    required this.total,
    required this.page,
    required this.pages,
  });

  factory SchoolListResponse.fromJson(Map<String, dynamic> json) => _$SchoolListResponseFromJson(json);
  Map<String, dynamic> toJson() => _$SchoolListResponseToJson(this);
}

@JsonSerializable()
class CreateSchoolRequest {
  final String name;
  final String email;
  @JsonKey(name: 'principalName')
  final String? principalName;
  @JsonKey(name: 'mobileNumber')
  final String? mobileNumber;
  final String? address;
  final String? city;
  final String? state;
  @JsonKey(name: 'postalCode')
  final String? postalCode;

  CreateSchoolRequest({
    required this.name,
    required this.email,
    this.principalName,
    this.mobileNumber,
    this.address,
    this.city,
    this.state,
    this.postalCode,
  });

  factory CreateSchoolRequest.fromJson(Map<String, dynamic> json) => _$CreateSchoolRequestFromJson(json);
  Map<String, dynamic> toJson() => _$CreateSchoolRequestToJson(this);
}

// ==================== IMAGE MODELS ====================

@JsonSerializable()
class ImageFetchRequest {
  final String folderPath;
  final int imagesPerPage;
  final int? page;

  ImageFetchRequest({
    required this.folderPath,
    this.imagesPerPage = 50,
    this.page,
  });

  factory ImageFetchRequest.fromJson(Map<String, dynamic> json) => _$ImageFetchRequestFromJson(json);
  Map<String, dynamic> toJson() => _$ImageFetchRequestToJson(this);
}

@JsonSerializable()
class ImageFetchResponse {
  final Map<String, String> list;
  final int total;
  final int page;
  final bool hasMore;

  ImageFetchResponse({
    required this.list,
    required this.total,
    required this.page,
    required this.hasMore,
  });

  factory ImageFetchResponse.fromJson(Map<String, dynamic> json) => _$ImageFetchResponseFromJson(json);
  Map<String, dynamic> toJson() => _$ImageFetchResponseToJson(this);
}

@JsonSerializable()
class MyImage {
  final String id;
  final String url;
  final String? name;
  @JsonKey(name: 'created_at')
  final String? createdAt;
  @JsonKey(name: 'is_favourite')
  final bool? isFavourite;

  MyImage({
    required this.id,
    required this.url,
    this.name,
    this.createdAt,
    this.isFavourite,
  });

  factory MyImage.fromJson(Map<String, dynamic> json) => _$MyImageFromJson(json);
  Map<String, dynamic> toJson() => _$MyImageToJson(this);
}

// ==================== SEARCH MODELS ====================

@JsonSerializable()
class SearchResult {
  final String type;
  final String title;
  final String url;
  final String? category;
  final String? subcategory;
  final String? thumbnail;

  SearchResult({
    required this.type,
    required this.title,
    required this.url,
    this.category,
    this.subcategory,
    this.thumbnail,
  });

  factory SearchResult.fromJson(Map<String, dynamic> json) => _$SearchResultFromJson(json);
  Map<String, dynamic> toJson() => _$SearchResultToJson(this);
}

@JsonSerializable()
class SearchResponse {
  final List<SearchResult> results;
  final int total;

  SearchResponse({
    required this.results,
    required this.total,
  });

  factory SearchResponse.fromJson(Map<String, dynamic> json) => _$SearchResponseFromJson(json);
  Map<String, dynamic> toJson() => _$SearchResponseToJson(this);
}

// ==================== TEMPLATE MODELS ====================

@JsonSerializable()
class CanvasElement {
  final String id;
  final String type;
  final double x;
  final double y;
  final double width;
  final double height;
  final double? rotation;
  final double? opacity;
  // Text properties
  final String? text;
  final int? fontSize;
  final String? fontFamily;
  final String? color;
  final bool? bold;
  final bool? italic;
  final String? align;
  // Image properties
  final String? src;
  // Shape properties
  final String? fill;
  final String? stroke;

  CanvasElement({
    required this.id,
    required this.type,
    required this.x,
    required this.y,
    required this.width,
    required this.height,
    this.rotation,
    this.opacity,
    this.text,
    this.fontSize,
    this.fontFamily,
    this.color,
    this.bold,
    this.italic,
    this.align,
    this.src,
    this.fill,
    this.stroke,
  });

  factory CanvasElement.fromJson(Map<String, dynamic> json) => _$CanvasElementFromJson(json);
  Map<String, dynamic> toJson() => _$CanvasElementToJson(this);
}

@JsonSerializable()
class Template {
  final String id;
  final String name;
  final String makerType;
  final String? pageSize;
  final String? canvasBg;
  final List<CanvasElement>? elements;
  final bool? isSystem;
  @JsonKey(name: 'created_at')
  final String? createdAt;

  Template({
    required this.id,
    required this.name,
    required this.makerType,
    this.pageSize,
    this.canvasBg,
    this.elements,
    this.isSystem,
    this.createdAt,
  });

  factory Template.fromJson(Map<String, dynamic> json) => _$TemplateFromJson(json);
  Map<String, dynamic> toJson() => _$TemplateToJson(this);
}

@JsonSerializable()
class SaveTemplateRequest {
  final String name;
  final String makerType;
  final String pageSize;
  final String canvasBg;
  final List<CanvasElement> elements;

  SaveTemplateRequest({
    required this.name,
    required this.makerType,
    required this.pageSize,
    required this.canvasBg,
    required this.elements,
  });

  factory SaveTemplateRequest.fromJson(Map<String, dynamic> json) => _$SaveTemplateRequestFromJson(json);
  Map<String, dynamic> toJson() => _$SaveTemplateRequestToJson(this);
}

// ==================== ADMIN MODELS ====================

@JsonSerializable()
class DashboardStats {
  final int totalImages;
  final int totalUsers;
  final int totalStudents;
  final int totalTeachers;
  final int totalSchools;
  final int? activeUsers;
  final int? disabledUsers;
  final List<ActivityItem>? recentActivity;
  final String userRole;

  DashboardStats({
    required this.totalImages,
    required this.totalUsers,
    required this.totalStudents,
    required this.totalTeachers,
    required this.totalSchools,
    this.activeUsers,
    this.disabledUsers,
    this.recentActivity,
    required this.userRole,
  });

  factory DashboardStats.fromJson(Map<String, dynamic> json) => _$DashboardStatsFromJson(json);
  Map<String, dynamic> toJson() => _$DashboardStatsToJson(this);
}

@JsonSerializable()
class ActivityItem {
  final String action;
  final String? user;
  final String timestamp;

  ActivityItem({
    required this.action,
    this.user,
    required this.timestamp,
  });

  factory ActivityItem.fromJson(Map<String, dynamic> json) => _$ActivityItemFromJson(json);
  Map<String, dynamic> toJson() => _$ActivityItemToJson(this);
}

@JsonSerializable()
class Category {
  final String name;
  final List<String> subcategories;

  Category({
    required this.name,
    required this.subcategories,
  });

  factory Category.fromJson(Map<String, dynamic> json) => _$CategoryFromJson(json);
  Map<String, dynamic> toJson() => _$CategoryToJson(this);
}

// ==================== PAYMENT MODELS ====================

@JsonSerializable()
class SubscriptionPlan {
  final String id;
  final String name;
  final int price;
  final String currency;
  final int credits;
  final List<String> features;

  SubscriptionPlan({
    required this.id,
    required this.name,
    required this.price,
    required this.currency,
    required this.credits,
    required this.features,
  });

  factory SubscriptionPlan.fromJson(Map<String, dynamic> json) => _$SubscriptionPlanFromJson(json);
  Map<String, dynamic> toJson() => _$SubscriptionPlanToJson(this);
}

@JsonSerializable()
class CheckoutRequest {
  final String planId;
  final String successUrl;
  final String cancelUrl;

  CheckoutRequest({
    required this.planId,
    required this.successUrl,
    required this.cancelUrl,
  });

  factory CheckoutRequest.fromJson(Map<String, dynamic> json) => _$CheckoutRequestFromJson(json);
  Map<String, dynamic> toJson() => _$CheckoutRequestToJson(this);
}

@JsonSerializable()
class CheckoutResponse {
  final String sessionId;
  final String url;

  CheckoutResponse({
    required this.sessionId,
    required this.url,
  });

  factory CheckoutResponse.fromJson(Map<String, dynamic> json) => _$CheckoutResponseFromJson(json);
  Map<String, dynamic> toJson() => _$CheckoutResponseToJson(this);
}

// ==================== SUPPORT MODELS ====================

@JsonSerializable()
class SupportRequest {
  final String subject;
  final String message;
  final String? category;

  SupportRequest({
    required this.subject,
    required this.message,
    this.category,
  });

  factory SupportRequest.fromJson(Map<String, dynamic> json) => _$SupportRequestFromJson(json);
  Map<String, dynamic> toJson() => _$SupportRequestToJson(this);
}

// ==================== ERROR MODEL ====================

@JsonSerializable()
class ApiError {
  final String detail;

  ApiError({required this.detail});

  factory ApiError.fromJson(Map<String, dynamic> json) => _$ApiErrorFromJson(json);
  Map<String, dynamic> toJson() => _$ApiErrorToJson(this);
}

// ==================== CONSTANTS ====================

class PageSizes {
  static const Map<String, Map<String, int>> sizes = {
    'A3': {'width': 1191, 'height': 1684},
    'A4': {'width': 794, 'height': 1123},
    'A5': {'width': 559, 'height': 794},
    'Letter': {'width': 816, 'height': 1056},
    'Square': {'width': 800, 'height': 800},
  };
}

class ApiEndpoints {
  static const String baseUrl = 'https://portal.myschoolct.com/api';
  
  // Auth
  static const String login = '/rest/auth/login';
  static const String register = '/rest/auth/register';
  static const String forgotPassword = '/rest/auth/forgotPassword';
  static const String confirmPassword = '/rest/auth/confirmPassword';
  static const String changePassword = '/rest/auth/changePassword';
  static const String sendOtp = '/rest/auth/sendOtp';
  static const String loginViaOtp = '/rest/auth/loginViaOtp';
  static const String refreshToken = '/rest/auth/refreshToken';
  
  // Users
  static const String getUserDetails = '/rest/users/getUserDetails';
  static const String updateUserDetails = '/rest/users/updateUserDetails';
  static const String checkCredits = '/rest/users/checkCredits';
  static const String listUsersByRole = '/rest/users/listUsersByRole';
  static const String searchUsers = '/rest/users/search';
  static const String disableAccount = '/rest/users/disableAccount';
  
  // Schools
  static const String createSchool = '/rest/school/create';
  static const String listSchools = '/rest/school/list';
  static const String activeSchools = '/rest/school/public/active';
  
  // Images
  static const String fetchImages = '/rest/images/fetch';
  static const String pdfThumbnail = '/rest/images/pdf-thumbnail';
  static const String myImages = '/rest/images/myImages/get';
  static const String favouriteImages = '/rest/images/myImages/getFavourite';
  static const String saveImage = '/rest/images/myImages/save';
  static const String addToFavourite = '/rest/images/myImages/addToFavourite';
  static const String downloadImage = '/rest/images/download';
  
  // Search
  static const String globalSearch = '/rest/search/global';
  static const String searchSuggestions = '/rest/search/suggestions';
  
  // Templates
  static const String listTemplates = '/rest/templates/list';
  static const String saveTemplate = '/rest/templates/save';
  
  // Admin
  static const String dashboardStats = '/rest/admin/dashboard-stats';
  static const String categories = '/rest/admin/categories';
  
  // Payments
  static const String plans = '/rest/payments/plans';
  static const String createCheckout = '/rest/payments/create-checkout-session';
  static const String paymentHistory = '/rest/payments/history';
  
  // Support
  static const String submitSupport = '/rest/support/submit';
}
