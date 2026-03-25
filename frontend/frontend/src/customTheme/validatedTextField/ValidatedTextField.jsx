import React, { useState, useCallback } from 'react';
import MSTextField from '../textField/MSTextField';
import { filterInput, validateField, getMaxLength, FIELD_VALIDATION_CONFIG } from '../../utils/fieldValidation';

/**
 * Validated TextField component that enforces field validation rules
 * Wraps MSTextField with input filtering and validation
 */
const ValidatedTextField = ({
    fieldName,
    value,
    onChange,
    label,
    placeholder,
    type = 'text',
    error: externalError,
    helperText: externalHelperText,
    disabled,
    required,
    ...props
}) => {
    const [touched, setTouched] = useState(false);
    const [internalError, setInternalError] = useState('');
    
    const config = FIELD_VALIDATION_CONFIG[fieldName];
    const maxLength = getMaxLength(fieldName);
    
    // Handle input change with validation
    const handleChange = useCallback((e) => {
        const rawValue = e.target.value;
        
        // Filter the input based on field rules
        const filteredValue = filterInput(rawValue, fieldName);
        
        // Create synthetic event with filtered value
        const syntheticEvent = {
            ...e,
            target: {
                ...e.target,
                value: filteredValue
            },
            preventDefault: () => {}
        };
        
        // Clear error when typing
        if (internalError) {
            setInternalError('');
        }
        
        // Call parent onChange with filtered value
        if (onChange) {
            onChange(syntheticEvent, fieldName);
        }
    }, [fieldName, onChange, internalError]);
    
    // Handle blur for validation
    const handleBlur = useCallback(() => {
        setTouched(true);
        
        if (value) {
            const { isValid, errorMessage } = validateField(value, fieldName);
            if (!isValid) {
                setInternalError(errorMessage);
            } else {
                setInternalError('');
            }
        }
    }, [value, fieldName]);
    
    // Determine error state
    const hasError = externalError || (touched && internalError);
    const errorText = externalHelperText || internalError;
    
    return (
        <MSTextField
            label={label}
            placeholder={placeholder}
            type={type}
            value={value || ''}
            onChange={handleChange}
            onBlur={handleBlur}
            error={hasError}
            helperText={hasError ? errorText : ''}
            disabled={disabled}
            required={required}
            inputProps={{
                maxLength: maxLength,
                ...props.inputProps
            }}
            {...props}
        />
    );
};

export default ValidatedTextField;
