// Field Validation Rules and Messages
// Based on MySchool Admin Dashboard Requirements

// Validation patterns
const PATTERNS = {
  alphabetsOnly: /^[A-Za-z\s]+$/,
  alphanumeric: /^[A-Za-z0-9]+$/,
  alphanumericSpace: /^[A-Za-z0-9\s\-]+$/,
  email: /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i,
  mobile10Digits: /^\d{10}$/,
  postal6Digits: /^\d{6}$/,
  address: /^[A-Za-z0-9\s\-#,./]+$/,
  password: /^[A-Za-z0-9@#$%^&*!]+$/,
  schoolName: /^[A-Za-z\s.\-]+$/,
};

// Field validation config for signup forms (legacy support)
export const FIELD_VALIDATION_CONFIG = {
  name: {
    pattern: PATTERNS.alphabetsOnly,
    maxLength: 40,
    errorMessage: 'Name should contain only alphabets (A-Z, a-z) and spaces',
  },
  userName: {
    pattern: PATTERNS.alphabetsOnly,
    maxLength: 40,
    errorMessage: 'Name should contain only alphabets (A-Z, a-z) and spaces',
  },
  parentName: {
    pattern: PATTERNS.alphabetsOnly,
    maxLength: 40,
    errorMessage: 'Parent name should contain only alphabets and spaces',
  },
  email: {
    pattern: PATTERNS.email,
    maxLength: 30,
    errorMessage: 'Please enter a valid email address',
  },
  emailId: {
    pattern: PATTERNS.email,
    maxLength: 30,
    errorMessage: 'Please enter a valid email address',
  },
  schoolCode: {
    pattern: PATTERNS.alphanumeric,
    maxLength: 16,
    errorMessage: 'School code should contain only letters and numbers',
  },
  mobileNumber: {
    pattern: PATTERNS.mobile10Digits,
    maxLength: 10,
    errorMessage: 'Mobile number must be exactly 10 digits',
  },
  address: {
    pattern: PATTERNS.address,
    maxLength: 100,
    errorMessage: 'Address contains invalid characters',
  },
  city: {
    pattern: PATTERNS.alphabetsOnly,
    maxLength: 35,
    errorMessage: 'City should contain only alphabets',
  },
  state: {
    pattern: PATTERNS.alphabetsOnly,
    maxLength: 35,
    errorMessage: 'State should contain only alphabets',
  },
  postalCode: {
    pattern: PATTERNS.postal6Digits,
    maxLength: 6,
    errorMessage: 'Postal code must be exactly 6 digits',
  },
  password: {
    pattern: PATTERNS.password,
    minLength: 6,
    maxLength: 20,
    errorMessage: 'Password must be 6-20 characters with letters, numbers, or special characters',
  },
  confirmPassword: {
    maxLength: 20,
    errorMessage: 'Passwords do not match',
  },
  className: {
    pattern: PATTERNS.alphanumericSpace,
    maxLength: 10,
    errorMessage: 'Class name should contain only letters, numbers, spaces, and hyphens',
  },
  rollNumber: {
    pattern: PATTERNS.alphanumeric,
    maxLength: 10,
    errorMessage: 'Roll number should contain only letters and numbers',
  },
  sectionName: {
    pattern: PATTERNS.alphanumericSpace,
    maxLength: 10,
    errorMessage: 'Section should contain letters, numbers, spaces, and hyphens',
  },
  fatherName: {
    pattern: PATTERNS.alphabetsOnly,
    maxLength: 40,
    errorMessage: 'Parent name should contain only alphabets and spaces',
  },
  principalName: {
    pattern: PATTERNS.alphabetsOnly,
    maxLength: 40,
    errorMessage: 'Principal name should contain only alphabets and spaces',
  },
  teacherCode: {
    pattern: PATTERNS.alphanumeric,
    maxLength: 16,
    errorMessage: 'Teacher code should contain only letters and numbers',
  },
};

// Helper functions for legacy support
export const getMaxLength = (fieldName) => {
  return FIELD_VALIDATION_CONFIG[fieldName]?.maxLength || 50;
};

export const getInputType = (fieldName) => {
  const emailFields = ['email', 'emailId'];
  const passwordFields = ['password', 'confirmPassword'];
  const numberFields = ['mobileNumber', 'postalCode'];
  
  if (emailFields.includes(fieldName)) return 'email';
  if (passwordFields.includes(fieldName)) return 'password';
  if (numberFields.includes(fieldName)) return 'tel';
  return 'text';
};

/**
 * Filter input based on field type - removes invalid characters as user types
 * @param {string} value - The input value
 * @param {string} fieldName - The field name to determine filtering rules
 * @returns {string} - Filtered value
 */
export const filterInput = (value, fieldName) => {
  if (!value) return value;
  
  const config = FIELD_VALIDATION_CONFIG[fieldName];
  if (!config) return value;
  
  // For number-only fields, remove non-digits
  if (['mobileNumber', 'postalCode'].includes(fieldName)) {
    return value.replace(/\D/g, '').slice(0, config.maxLength);
  }
  
  // For alphabet-only fields, remove numbers and special chars
  if (['name', 'userName', 'parentName', 'fatherName', 'motherName', 'principalName', 'city', 'state'].includes(fieldName)) {
    return value.replace(/[^A-Za-z\s]/g, '').slice(0, config.maxLength);
  }
  
  // For section name (alphanumeric with spaces and hyphens)
  if (fieldName === 'sectionName') {
    return value.replace(/[^A-Za-z0-9\s\-]/g, '').slice(0, config.maxLength);
  }
  
  // For alphanumeric fields
  if (['schoolCode', 'teacherCode', 'rollNumber'].includes(fieldName)) {
    return value.replace(/[^A-Za-z0-9]/g, '').slice(0, config.maxLength);
  }
  
  // For class name (alphanumeric with spaces and hyphens)
  if (fieldName === 'className') {
    return value.replace(/[^A-Za-z0-9\s\-]/g, '').slice(0, config.maxLength);
  }
  
  // For address (more permissive)
  if (fieldName === 'address') {
    return value.replace(/[^A-Za-z0-9\s\-#,./]/g, '').slice(0, config.maxLength);
  }
  
  // Apply max length only for other fields
  if (config.maxLength) {
    return value.slice(0, config.maxLength);
  }
  
  return value;
};

// Field validation rules with user-friendly messages
export const FIELD_RULES = {
  userName: {
    pattern: PATTERNS.alphabetsOnly,
    minLength: 1,
    maxLength: 40,
    errorMessages: {
      pattern: 'Name should contain only alphabets (A-Z, a-z) and spaces',
      minLength: 'Name is required',
      maxLength: 'Name cannot exceed 40 characters',
    },
  },
  email: {
    pattern: PATTERNS.email,
    minLength: 1,
    maxLength: 30,
    errorMessages: {
      pattern: 'Please enter a valid email address (e.g., user@example.com)',
      minLength: 'Email is required',
      maxLength: 'Email cannot exceed 30 characters',
    },
  },
  schoolCode: {
    pattern: PATTERNS.alphanumeric,
    minLength: 1,
    maxLength: 16,
    errorMessages: {
      pattern: 'School code should contain only letters and numbers (A-Z, a-z, 0-9)',
      minLength: 'School code is required',
      maxLength: 'School code cannot exceed 16 characters',
    },
  },
  mobileNumber: {
    pattern: PATTERNS.mobile10Digits,
    exactLength: 10,
    errorMessages: {
      pattern: 'Mobile number should contain only digits (0-9)',
      exactLength: 'Mobile number must be exactly 10 digits',
    },
  },
  address: {
    pattern: PATTERNS.address,
    minLength: 1,
    maxLength: 100,
    errorMessages: {
      pattern: 'Address can contain letters, numbers, spaces, and special characters (-, #, ., /)',
      minLength: 'Address is required',
      maxLength: 'Address cannot exceed 100 characters',
    },
  },
  city: {
    pattern: PATTERNS.alphabetsOnly,
    minLength: 2,
    maxLength: 35,
    errorMessages: {
      pattern: 'City should contain only alphabets',
      minLength: 'City name must be at least 2 characters',
      maxLength: 'City name cannot exceed 35 characters',
    },
  },
  state: {
    pattern: PATTERNS.alphabetsOnly,
    minLength: 2,
    maxLength: 35,
    errorMessages: {
      pattern: 'State should contain only alphabets',
      minLength: 'State name must be at least 2 characters',
      maxLength: 'State name cannot exceed 35 characters',
    },
  },
  postalCode: {
    pattern: PATTERNS.postal6Digits,
    exactLength: 6,
    errorMessages: {
      pattern: 'Postal code should contain only digits (0-9)',
      exactLength: 'Postal code must be exactly 6 digits',
    },
  },
  password: {
    pattern: PATTERNS.password,
    minLength: 6,
    maxLength: 20,
    errorMessages: {
      pattern: 'Password can contain letters, numbers, and special characters (@, #, $, %, ^, &, *, !)',
      minLength: 'Password must be at least 6 characters',
      maxLength: 'Password cannot exceed 20 characters',
    },
  },
  parentName: {
    pattern: PATTERNS.alphabetsOnly,
    minLength: 1,
    maxLength: 40,
    errorMessages: {
      pattern: 'Parent name should contain only alphabets and spaces',
      minLength: 'Parent name is required',
      maxLength: 'Parent name cannot exceed 40 characters',
    },
  },
  className: {
    pattern: PATTERNS.alphanumericSpace,
    minLength: 1,
    maxLength: 10,
    errorMessages: {
      pattern: 'Class name should contain only letters, numbers, spaces, and hyphens',
      minLength: 'Class name is required',
      maxLength: 'Class name cannot exceed 10 characters',
    },
  },
  rollNumber: {
    pattern: PATTERNS.alphanumeric,
    minLength: 1,
    maxLength: 10,
    errorMessages: {
      pattern: 'Roll number should contain only letters and numbers',
      minLength: 'Roll number is required',
      maxLength: 'Roll number cannot exceed 10 characters',
    },
  },
  section: {
    pattern: PATTERNS.alphanumericSpace,
    minLength: 1,
    maxLength: 10,
    errorMessages: {
      pattern: 'Section should contain letters, numbers, spaces, and hyphens',
      minLength: 'Section is required',
      maxLength: 'Section cannot exceed 10 characters',
    },
  },
  schoolName: {
    pattern: PATTERNS.schoolName,
    minLength: 1,
    maxLength: 40,
    errorMessages: {
      pattern: 'School name should contain only alphabets, spaces, dots, and hyphens',
      minLength: 'School name is required',
      maxLength: 'School name cannot exceed 40 characters',
    },
  },
  principalName: {
    pattern: PATTERNS.alphabetsOnly,
    minLength: 1,
    maxLength: 40,
    errorMessages: {
      pattern: 'Principal name should contain only alphabets and spaces',
      minLength: 'Principal name is required',
      maxLength: 'Principal name cannot exceed 40 characters',
    },
  },
};

/**
 * Validate a single field
 * @param {string} fieldName - Name of the field rule to use
 * @param {string} value - Value to validate
 * @param {boolean} required - Whether the field is required
 * @returns {{ isValid: boolean, error: string | null }}
 */
export const validateField = (fieldName, value, required = false) => {
  const rules = FIELD_RULES[fieldName];
  if (!rules) {
    return { isValid: true, error: null };
  }

  const { pattern, minLength, maxLength, exactLength, errorMessages } = rules;

  // Handle empty values
  if (value === null || value === undefined || value.toString().trim() === '') {
    if (required) {
      return { isValid: false, error: errorMessages.minLength || `${fieldName} is required` };
    }
    return { isValid: true, error: null };
  }

  // Clean the value
  let cleanValue = value.toString().trim();

  // For mobile/postal, remove spaces and dashes for validation
  if (fieldName === 'mobileNumber' || fieldName === 'postalCode') {
    cleanValue = cleanValue.replace(/[\s\-]/g, '');
  }

  // Check exact length
  if (exactLength && cleanValue.length !== exactLength) {
    return { isValid: false, error: errorMessages.exactLength };
  }

  // Check min length
  if (minLength && cleanValue.length < minLength) {
    return { isValid: false, error: errorMessages.minLength };
  }

  // Check max length
  if (maxLength && cleanValue.length > maxLength) {
    return { isValid: false, error: errorMessages.maxLength };
  }

  // Check pattern
  if (pattern) {
    const testValue = fieldName === 'email' ? cleanValue.toLowerCase() : cleanValue;
    if (!pattern.test(testValue)) {
      return { isValid: false, error: errorMessages.pattern };
    }
  }

  return { isValid: true, error: null };
};

/**
 * Validate multiple fields at once
 * @param {Object} fields - Object with field names as keys and { value, required } as values
 * @returns {{ isValid: boolean, errors: Object }}
 */
export const validateFields = (fields) => {
  const errors = {};
  let isValid = true;

  Object.entries(fields).forEach(([fieldName, config]) => {
    const { value, required = false } = config;
    const result = validateField(fieldName, value, required);
    if (!result.isValid) {
      errors[fieldName] = result.error;
      isValid = false;
    }
  });

  return { isValid, errors };
};

/**
 * Get field constraints for input props
 * @param {string} fieldName - Name of the field
 * @returns {{ maxLength: number, pattern?: string }}
 */
export const getFieldConstraints = (fieldName) => {
  const rules = FIELD_RULES[fieldName];
  if (!rules) {
    return {};
  }

  const constraints = {};
  if (rules.maxLength) {
    constraints.maxLength = rules.maxLength;
  }
  if (rules.exactLength) {
    constraints.maxLength = rules.exactLength;
  }
  return constraints;
};

/**
 * Validate form for Add Teacher
 * @param {Object} formData - Form data to validate
 * @returns {{ isValid: boolean, errors: Object }}
 */
export const validateTeacherForm = (formData) => {
  return validateFields({
    userName: { value: formData.name, required: true },
    email: { value: formData.email, required: true },
    mobileNumber: { value: formData.mobileNumber, required: true },
    schoolCode: { value: formData.schoolCode, required: false },
    address: { value: formData.address, required: false },
    city: { value: formData.city, required: false },
    state: { value: formData.state, required: false },
    postalCode: { value: formData.postalCode, required: false },
  });
};

/**
 * Validate form for Add Student
 * @param {Object} formData - Form data to validate
 * @returns {{ isValid: boolean, errors: Object }}
 */
export const validateStudentForm = (formData) => {
  return validateFields({
    userName: { value: formData.name, required: true },
    email: { value: formData.email, required: true },
    mobileNumber: { value: formData.mobileNumber, required: true },
    className: { value: formData.className, required: true },
    section: { value: formData.section, required: true },
    rollNumber: { value: formData.rollNumber, required: false },
    parentName: { value: formData.fatherName || formData.parentName, required: true },
    schoolCode: { value: formData.schoolCode, required: false },
    address: { value: formData.address, required: false },
    city: { value: formData.city, required: false },
    state: { value: formData.state, required: false },
    postalCode: { value: formData.postalCode, required: false },
  });
};

/**
 * Validate form for Add School
 * @param {Object} formData - Form data to validate
 * @returns {{ isValid: boolean, errors: Object }}
 */
export const validateSchoolForm = (formData) => {
  return validateFields({
    schoolName: { value: formData.name, required: true },
    email: { value: formData.adminEmail, required: true },
    userName: { value: formData.adminName, required: true },
    mobileNumber: { value: formData.adminPhone, required: true },
    principalName: { value: formData.principalName, required: false },
    address: { value: formData.address, required: false },
    city: { value: formData.city, required: false },
    state: { value: formData.state, required: false },
    postalCode: { value: formData.postalCode, required: false },
  });
};

export default {
  FIELD_RULES,
  validateField,
  validateFields,
  getFieldConstraints,
  validateTeacherForm,
  validateStudentForm,
  validateSchoolForm,
};
