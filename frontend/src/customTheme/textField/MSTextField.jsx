import React, { useState, useEffect } from 'react'
import { TextField, InputAdornment, FormHelperText, IconButton } from '@mui/material'
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'

// Max lengths for fields (based on Excel validation requirements)
const maxLengths = {
    name: 40,           // User Name: 40 chars, alphabets only
    userName: 40,       // User Name: 40 chars, alphabets only
    schoolName: 40,     // School Name: 40 chars, alphabets only
    schoolCode: 16,     // School Code: 16 chars, alphanumeric
    principalName: 40,  // Principal Name: 40 chars, alphabets only
    mobileNumber: 10,   // Mobile: 10 digits
    emailId: 30,        // Email: 30 chars
    email: 30,          // Email: 30 chars
    address: 100,       // Address: 100 chars, alphanumeric + special chars
    city: 35,           // City: 35 chars, alphabets only
    state: 35,          // State: 35 chars, alphabets only
    postalCode: 6,      // Postal Code: 6 digits
    password: 20,       // Password: alphanumeric + @
    confirmPassword: 20,// Confirm Password: alphanumeric + @
    className: 10,      // Class Name: 10 chars, alphanumeric
    rollNumber: 10,     // Roll Number: 10 chars, alphanumeric
    sectionName: 10,    // Section: 10 chars, alphabets only
    section: 10,        // Section: 10 chars, alphabets only
    fatherName: 40,     // Parent Name: 40 chars, alphabets only
    parentName: 40,     // Parent Name: 40 chars, alphabets only
    teacherCode: 16,    // Teacher Code: auto-generate
    studentCode: 16,    // Student Code: auto-generate
};

// Fields that only allow alphabets and spaces (A-Z, a-z)
const alphabetOnlyFields = ['name', 'userName', 'principalName', 'fatherName', 'parentName', 'city', 'state', 'sectionName', 'section', 'schoolName'];

// Fields that only allow numbers (0-9)
const numberOnlyFields = ['mobileNumber', 'postalCode'];

// Fields that allow alphanumeric only (A-Z, a-z, 0-9)
const alphanumericFields = ['schoolCode', 'teacherCode', 'studentCode', 'rollNumber', 'className'];

const MSTextField = (props) => {
    const [error, setError] = useState('');
    const [internalValue, setInternalValue] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    
    const maxLength = maxLengths[props.fieldName] || 200;
    const isPasswordField = props.type === 'password' || props.fieldName === 'password' || props.fieldName === 'confirmPassword';
    
    // Use props.value if provided (controlled), otherwise use internal state (uncontrolled)
    const isControlled = props.value !== undefined;
    const displayValue = isControlled ? props.value : internalValue;
    
    // Reset internal value when props.value changes to empty (for form reset)
    useEffect(() => {
        if (isControlled && props.value === '') {
            setInternalValue('');
            setError('');
        }
    }, [props.value, isControlled]);
    
    // Real-time validation and filtering
    const validateAndFilter = (value, fieldName) => {
        let filteredValue = value;
        let validationError = '';
        
        // Filter for alphabet-only fields (remove numbers and special chars as typed)
        if (alphabetOnlyFields.includes(fieldName)) {
            filteredValue = value.replace(/[^A-Za-z\s]/g, '');
            if (value !== filteredValue && value.length > 0) {
                validationError = 'Only letters and spaces allowed';
            }
        }
        
        // Filter for number-only fields (remove non-digits as typed)
        if (numberOnlyFields.includes(fieldName)) {
            filteredValue = value.replace(/\D/g, '');
            if (value !== filteredValue && value.length > 0) {
                validationError = 'Only numbers allowed';
            }
        }
        
        // Filter for alphanumeric fields
        if (alphanumericFields.includes(fieldName)) {
            filteredValue = value.replace(/[^A-Za-z0-9]/g, '');
            if (value !== filteredValue && value.length > 0) {
                validationError = 'Only letters and numbers allowed';
            }
        }
        
        // Enforce max length
        if (maxLength && filteredValue.length > maxLength) {
            filteredValue = filteredValue.slice(0, maxLength);
        }
        
        return { filteredValue, validationError };
    };
    
    const handleChange = (e) => {
        let value = e.target.value;
        
        // Apply real-time validation and filtering
        const { filteredValue, validationError } = validateAndFilter(value, props.fieldName);
        value = filteredValue;
        
        // Set error briefly then clear (for instant feedback)
        if (validationError) {
            setError(validationError);
            // Clear error after 2 seconds
            setTimeout(() => setError(''), 2000);
        } else {
            setError('');
        }
        
        // Update internal state for uncontrolled mode
        if (!isControlled) {
            setInternalValue(value);
        }
        
        // Call parent onChange
        if (props.onChange) {
            const modifiedEvent = { 
                target: { value },
                preventDefault: () => {}  // Add preventDefault for forms that call it
            };
            if (props.fieldName) {
                props.onChange(modifiedEvent, props.fieldName);
            } else {
                props.onChange(modifiedEvent);
            }
        }
    };
    
    const handleBlur = () => {
        const value = displayValue;
        
        // Email validation on blur
        if ((props.fieldName === 'emailId' || props.fieldName === 'email' || props.type === 'email') && value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                setError('Enter a valid email address');
                return;
            }
        }
        
        // Mobile number validation on blur (must be 10 digits)
        if (props.fieldName === 'mobileNumber' && value) {
            if (value.length !== 10) {
                setError('Mobile number must be exactly 10 digits');
                return;
            }
        }
        
        // Postal code validation on blur (must be 6 digits)
        if (props.fieldName === 'postalCode' && value) {
            if (value.length !== 6) {
                setError('Postal code must be exactly 6 digits');
                return;
            }
        }
        
        // Password validation on blur
        if ((props.fieldName === 'password' || props.fieldName === 'confirmPassword' || props.type === 'password') && value) {
            if (value.length > 15) {
                setError('Password must not exceed 15 characters');
                return;
            }
            if (value.length < 6) {
                setError('Password must be at least 6 characters');
                return;
            }
            if (!/[A-Z]/.test(value)) {
                setError('Password must contain at least one capital letter');
                return;
            }
        }
        
        setError('');
    };
    
    const handleTogglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const handleMouseDownPassword = (event) => {
        event.preventDefault();
    };
    
    // Get the start adornment for school/teacher code fields
    const getStartAdornment = () => {
        if (props.fieldName === "schoolCode") {
            return <InputAdornment position="start">SC </InputAdornment>;
        }
        if (props.fieldName === "teacherCode") {
            return <InputAdornment position="start">TR </InputAdornment>;
        }
        return null;
    };
    
    // Get the end adornment for password fields (eye icon)
    const getEndAdornment = () => {
        if (isPasswordField) {
            return (
                <InputAdornment position="end">
                    <IconButton
                        aria-label="toggle password visibility"
                        onClick={handleTogglePasswordVisibility}
                        onMouseDown={handleMouseDownPassword}
                        edge="end"
                        size="small"
                    >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                </InputAdornment>
            );
        }
        return null;
    };
    
    return (
        <div style={[{
            display: 'flex',
            flexDirection: 'column'
        }, props.style].reduce((acc, curr) => Object.assign(acc, curr), {})}>
            <label htmlFor={props.id}>{props.label}</label>
            {props.label ? 
            <>
                <TextField 
                    type={isPasswordField ? (showPassword ? 'text' : 'password') : props.type} 
                    id={props.id} 
                    disabled={props.disabled}
                    value={displayValue} 
                    style={props.style}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={!!error || props.error}
                    helperText={error || props.helperText}
                    inputProps={{
                        maxLength: maxLength,
                        autoComplete: isPasswordField ? 'new-password' : 'off'
                    }}
                    InputProps={{
                        startAdornment: getStartAdornment(),
                        endAdornment: getEndAdornment()
                    }}
                    sx={{
                        '& input::placeholder': {
                            color: '#aaa',
                            opacity: 0.6,
                            fontStyle: 'italic',
                        },
                        '& .MuiOutlinedInput-root': {
                            '&.Mui-error': {
                                '& fieldset': {
                                    borderColor: '#d32f2f',
                                    borderWidth: '2px',
                                },
                            },
                        },
                        '& .MuiFormHelperText-root.Mui-error': {
                            color: '#d32f2f',
                            fontWeight: 500,
                            marginTop: '4px',
                        },
                    }}
                    fullWidth 
                    placeholder={props.placeholder} 
                    size='small' 
                />
            </> : null }
        </div>
    )
}
export default MSTextField
