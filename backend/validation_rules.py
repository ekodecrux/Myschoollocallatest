# Field Validation Rules and Messages
# Based on MySchool Admin Dashboard Requirements

import re
from typing import Tuple, Optional

# Validation patterns
PATTERNS = {
    'alphabets_only': r'^[A-Za-z\s]+$',
    'alphanumeric': r'^[A-Za-z0-9]+$',
    'alphanumeric_space': r'^[A-Za-z0-9\s\-]+$',
    'email': r'^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$',
    'mobile_10_digits': r'^\d{10}$',
    'postal_6_digits': r'^\d{6}$',
    'address': r'^[A-Za-z0-9\s\-\#\,\.\/]+$',
    'password': r'^[A-Za-z0-9@#$%^&*!]+$',
    'school_name': r'^[A-Za-z\s\.\-]+$',
}

# Field rules with user-friendly messages
FIELD_RULES = {
    'user_name': {
        'pattern': PATTERNS['alphabets_only'],
        'min_length': 1,
        'max_length': 40,
        'error_messages': {
            'pattern': 'Name should contain only alphabets (A-Z, a-z) and spaces',
            'min_length': 'Name is required',
            'max_length': 'Name cannot exceed 40 characters'
        }
    },
    'email': {
        'pattern': PATTERNS['email'],
        'min_length': 1,
        'max_length': 30,
        'error_messages': {
            'pattern': 'Please enter a valid email address (e.g., user@example.com)',
            'min_length': 'Email is required',
            'max_length': 'Email cannot exceed 30 characters'
        }
    },
    'school_code': {
        'pattern': PATTERNS['alphanumeric'],
        'min_length': 1,
        'max_length': 16,
        'error_messages': {
            'pattern': 'School code should contain only letters and numbers (A-Z, a-z, 0-9)',
            'min_length': 'School code is required',
            'max_length': 'School code cannot exceed 16 characters'
        }
    },
    'mobile_number': {
        'pattern': PATTERNS['mobile_10_digits'],
        'exact_length': 10,
        'error_messages': {
            'pattern': 'Mobile number should contain only digits (0-9)',
            'exact_length': 'Mobile number must be exactly 10 digits'
        }
    },
    'address': {
        'pattern': PATTERNS['address'],
        'min_length': 1,
        'max_length': 100,
        'error_messages': {
            'pattern': 'Address can contain letters, numbers, spaces, and special characters (-, #, ., /)',
            'min_length': 'Address is required',
            'max_length': 'Address cannot exceed 100 characters'
        }
    },
    'city': {
        'pattern': PATTERNS['alphabets_only'],
        'min_length': 2,
        'max_length': 35,
        'error_messages': {
            'pattern': 'City should contain only alphabets',
            'min_length': 'City name must be at least 2 characters',
            'max_length': 'City name cannot exceed 35 characters'
        }
    },
    'state': {
        'pattern': PATTERNS['alphabets_only'],
        'min_length': 2,
        'max_length': 35,
        'error_messages': {
            'pattern': 'State should contain only alphabets',
            'min_length': 'State name must be at least 2 characters',
            'max_length': 'State name cannot exceed 35 characters'
        }
    },
    'postal_code': {
        'pattern': PATTERNS['postal_6_digits'],
        'exact_length': 6,
        'error_messages': {
            'pattern': 'Postal code should contain only digits (0-9)',
            'exact_length': 'Postal code must be exactly 6 digits'
        }
    },
    'password': {
        'pattern': PATTERNS['password'],
        'min_length': 6,
        'max_length': 20,
        'error_messages': {
            'pattern': 'Password can contain letters, numbers, and special characters (@, #, $, %, ^, &, *, !)',
            'min_length': 'Password must be at least 6 characters',
            'max_length': 'Password cannot exceed 20 characters'
        }
    },
    'parent_name': {
        'pattern': PATTERNS['alphabets_only'],
        'min_length': 1,
        'max_length': 40,
        'error_messages': {
            'pattern': 'Parent name should contain only alphabets and spaces',
            'min_length': 'Parent name is required',
            'max_length': 'Parent name cannot exceed 40 characters'
        }
    },
    'class_name': {
        'pattern': PATTERNS['alphanumeric_space'],
        'min_length': 1,
        'max_length': 10,
        'error_messages': {
            'pattern': 'Class name should contain only letters, numbers, spaces, and hyphens',
            'min_length': 'Class name is required',
            'max_length': 'Class name cannot exceed 10 characters'
        }
    },
    'roll_number': {
        'pattern': PATTERNS['alphanumeric'],
        'min_length': 1,
        'max_length': 10,
        'error_messages': {
            'pattern': 'Roll number should contain only letters and numbers',
            'min_length': 'Roll number is required',
            'max_length': 'Roll number cannot exceed 10 characters'
        }
    },
    'section': {
        'pattern': PATTERNS['alphabets_only'],
        'min_length': 1,
        'max_length': 10,
        'error_messages': {
            'pattern': 'Section should contain only alphabets (A-Z, a-z)',
            'min_length': 'Section is required',
            'max_length': 'Section cannot exceed 10 characters'
        }
    },
    'school_name': {
        'pattern': PATTERNS['school_name'],
        'min_length': 1,
        'max_length': 40,
        'error_messages': {
            'pattern': 'School name should contain only alphabets, spaces, dots, and hyphens',
            'min_length': 'School name is required',
            'max_length': 'School name cannot exceed 40 characters'
        }
    },
    'principal_name': {
        'pattern': PATTERNS['alphabets_only'],
        'min_length': 1,
        'max_length': 40,
        'error_messages': {
            'pattern': 'Principal name should contain only alphabets and spaces',
            'min_length': 'Principal name is required',
            'max_length': 'Principal name cannot exceed 40 characters'
        }
    }
}

def validate_field(field_name: str, value: str, required: bool = False) -> Tuple[bool, Optional[str]]:
    """
    Validate a field value against its rules.
    Returns (is_valid, error_message)
    """
    if field_name not in FIELD_RULES:
        return True, None
    
    rules = FIELD_RULES[field_name]
    messages = rules['error_messages']
    
    # Handle empty/None values
    if value is None or (isinstance(value, str) and value.strip() == ''):
        if required:
            return False, messages.get('min_length', f'{field_name} is required')
        return True, None
    
    # Clean the value
    value = str(value).strip()
    
    # Check exact length
    if 'exact_length' in rules:
        # For mobile/postal, strip non-digits first for length check
        clean_value = re.sub(r'\D', '', value) if field_name in ['mobile_number', 'postal_code'] else value
        if len(clean_value) != rules['exact_length']:
            return False, messages.get('exact_length')
    
    # Check min length
    if 'min_length' in rules and len(value) < rules['min_length']:
        return False, messages.get('min_length')
    
    # Check max length
    if 'max_length' in rules and len(value) > rules['max_length']:
        return False, messages.get('max_length')
    
    # Check pattern
    if 'pattern' in rules:
        # For mobile/postal, clean before pattern check
        check_value = re.sub(r'[\s\-]', '', value) if field_name in ['mobile_number', 'postal_code'] else value
        check_value = check_value.lower() if field_name == 'email' else check_value
        
        if not re.match(rules['pattern'], check_value):
            return False, messages.get('pattern')
    
    return True, None

def validate_bulk_row(row_data: dict, entity_type: str) -> Tuple[bool, list]:
    """
    Validate a row of bulk upload data.
    Returns (is_valid, list of error messages)
    """
    errors = []
    
    if entity_type == 'school':
        required_fields = ['school_name', 'admin_email']
        field_mapping = {
            'school_name': 'school_name',
            'admin_email': 'email',
            'admin_name': 'user_name',
            'mobile_number': 'mobile_number',
            'principal_name': 'principal_name',
            'address': 'address',
            'city': 'city',
            'state': 'state',
            'postal_code': 'postal_code'
        }
    elif entity_type == 'teacher':
        required_fields = ['name', 'email', 'mobile_number']
        field_mapping = {
            'name': 'user_name',
            'email': 'email',
            'mobile_number': 'mobile_number',
            'school_code': 'school_code',
            'address': 'address',
            'city': 'city',
            'state': 'state',
            'postal_code': 'postal_code'
        }
    elif entity_type == 'student':
        required_fields = ['name', 'email', 'mobile_number', 'class_name', 'section']
        field_mapping = {
            'name': 'user_name',
            'email': 'email',
            'mobile_number': 'mobile_number',
            'school_code': 'school_code',
            'class_name': 'class_name',
            'section': 'section',
            'roll_number': 'roll_number',
            'father_name': 'parent_name',
            'address': 'address',
            'city': 'city',
            'state': 'state',
            'postal_code': 'postal_code'
        }
    else:
        return True, []
    
    for field_key, rule_key in field_mapping.items():
        value = row_data.get(field_key)
        is_required = field_key in required_fields
        
        is_valid, error_msg = validate_field(rule_key, value, is_required)
        if not is_valid:
            errors.append(f"{field_key}: {error_msg}")
    
    return len(errors) == 0, errors
