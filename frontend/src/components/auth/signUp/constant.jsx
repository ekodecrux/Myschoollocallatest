import { FIELD_VALIDATION_CONFIG, getMaxLength, getInputType } from '../../../utils/fieldValidation';

// Helper to create field config with validation
const createField = (label, fieldName, placeholder, options = {}) => ({
    label: options.required !== false ? <><span style={{color : 'red'}}>* </span>{label}</> : label,
    type: getInputType(fieldName),
    placeholder,
    fieldName,
    index: 0,
    maxLength: getMaxLength(fieldName),
    validation: FIELD_VALIDATION_CONFIG[fieldName],
    ...options
});

export const School = [
    createField('School Name', 'name', '* School name', { maxLength: 40 }),
    createField('School Code', 'schoolCode', 'School Code ex. 123456789'),
    createField('Principal Name', 'principalName', 'Principal Name'),
    { label: null },
    createField('Mobile Number', 'mobileNumber', '+91 99999 99999'),
    createField('Email Id', 'emailId', 'school@example.com', { type: 'email' }),
    createField('Address', 'address', 'Enter your Address', { required: false }),
    createField('City', 'city', 'City', { required: false }),
    createField('State', 'state', 'State', { required: false }),
    createField('Postal Code', 'postalCode', 'Enter The Postal Code', { required: false }),
    createField('Password', 'password', 'Enter your password', { type: 'password' }),
    createField('Confirm Password', 'confirmPassword', 'Renter your password', { type: 'password' }),
];

export const Teacher = [
    createField('User Name', 'name', 'User name', { maxLength: 50, validation: FIELD_VALIDATION_CONFIG.userName }),
    { label: null },
    createField('School Code', 'schoolCode', 'School Code'),
    { label: null },
    createField('Mobile Number', 'mobileNumber', '+91 99999 99999'),
    createField('Email Id', 'emailId', 'teacher@example.com', { type: 'email' }),
    createField('Address', 'address', 'Enter your Address', { required: false }),
    createField('City', 'city', 'City', { required: false }),
    createField('State', 'state', 'State', { required: false }),
    createField('Postal Code', 'postalCode', 'Enter The Postal Code', { required: false }),
    createField('Password', 'password', 'Enter your password', { type: 'password' }),
    createField('Confirm Password', 'confirmPassword', 'Renter your password', { type: 'password' }),
];

export const Parent = [
    createField('User Name', 'name', 'User name', { maxLength: 50, validation: FIELD_VALIDATION_CONFIG.parentName }),
    { label: null },
    createField('Mobile Number', 'mobileNumber', '+91 99999 99999'),
    createField('Email Id', 'emailId', 'parent@example.com', { type: 'email' }),
    createField('Address', 'address', 'Enter your Address', { required: false }),
    createField('City', 'city', 'City', { required: false }),
    createField('State', 'state', 'State', { required: false }),
    createField('Postal Code', 'postalCode', 'Enter The Postal Code', { required: false }),
    createField('Password', 'password', 'Enter your password', { type: 'password' }),
    createField('Confirm Password', 'confirmPassword', 'Renter your password', { type: 'password' }),
];

export const Student = [
    createField('User Name', 'name', 'User name', { maxLength: 50, validation: FIELD_VALIDATION_CONFIG.userName }),
    { label: null },
    createField('Class Name', 'className', 'Class name'),
    createField('Roll Number', 'rollNumber', 'Roll Number'),
    createField('Section', 'sectionName', 'Section'),
    createField('School Code', 'schoolCode', 'School Code'),
    createField('Parent Name', 'fatherName', 'Parent Name'),
    createField('Teacher Code', 'teacherCode', 'Teacher Code'),
    createField('Parent Mobile Number', 'mobileNumber', '+91 99999 99999'),
    createField('Email Id', 'emailId', 'student@example.com', { type: 'email' }),
    createField('Address', 'address', 'Enter your Address', { required: false }),
    createField('City', 'city', 'City', { required: false }),
    createField('State', 'state', 'State', { required: false }),
    createField('Postal Code', 'postalCode', 'Enter The Postal Code', { required: false }),
    createField('Password', 'password', 'Enter your password', { type: 'password' }),
    createField('Confirm Password', 'confirmPassword', 'Renter your password', { type: 'password' }),
];

export const Publisher = [
    createField('User Name', 'name', 'User name', { maxLength: 50, validation: FIELD_VALIDATION_CONFIG.userName }),
    { label: null },
    createField('Mobile Number', 'mobileNumber', '+91 99999 99999'),
    createField('Email Id', 'emailId', 'publisher@example.com', { type: 'email' }),
    createField('Address', 'address', 'Enter your Address', { required: false }),
    createField('City', 'city', 'City', { required: false }),
    createField('State', 'state', 'State', { required: false }),
    createField('Postal Code', 'postalCode', 'Enter The Postal Code', { required: false }),
    createField('Password', 'password', 'Enter your password', { type: 'password' }),
    createField('Confirm Password', 'confirmPassword', 'Renter your password', { type: 'password' }),
];

export const formFields = {
    "School": School,
    "Student": Student,
    "Teacher": Teacher,
    "Parent": Parent,
    "Publisher": Publisher
};
