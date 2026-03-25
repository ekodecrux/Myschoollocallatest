// MongoDB Setup Script for MySchool
// Run with: mongosh < mongodb_setup.js

// Switch to myschool database
use myschool_db;

// Create database user
db.createUser({
  user: "myschool_user",
  pwd: "CHANGE_THIS_PASSWORD",
  roles: [
    { role: "readWrite", db: "myschool_db" }
  ]
});

// Create indexes for better performance
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "role": 1 });
db.users.createIndex({ "school_code": 1 });
db.users.createIndex({ "teacher_code": 1 });

db.schools.createIndex({ "code": 1 }, { unique: true });
db.schools.createIndex({ "admin_id": 1 });

db.resource_images.createIndex({ "category": 1 });
db.resource_images.createIndex({ "menu": 1 });
db.resource_images.createIndex({ "tags": 1 });
db.resource_images.createIndex({ "title": "text", "description": "text", "tags": "text" });

db.pending_approvals.createIndex({ "status": 1 });
db.pending_approvals.createIndex({ "school_code": 1 });

// Create Super Admin user (change password hash before using)
db.users.insertOne({
  id: "super-admin-001",
  email: "superadmin@myschool.in",
  password_hash: "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4ttUeIFu4L1R6YLi", // Default: superadminpassword
  name: "Super Admin",
  role: "SUPER_ADMIN",
  credits: 9999,
  is_active: true,
  created_at: new Date().toISOString()
});

print("Database setup complete!");
print("Default Super Admin: superadmin@myschool.in / superadminpassword");
print("IMPORTANT: Change the password immediately after first login!");
