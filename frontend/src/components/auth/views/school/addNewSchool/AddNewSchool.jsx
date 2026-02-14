import { Button, Paper, Typography } from "@mui/material";
import React, { useState, useEffect } from "react";
import MSTextField from "../../../../../customTheme/textField/MSTextField";
import home from "../../../../../assests/homeScreen/home.png";
import "../../student/addNewStudent/AddNewStudent.css";
import { BrowserView, MobileView } from "react-device-detect";
import Btn from "../../../../../customTheme/button/Button";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useSnackbar } from "../../../../../hook/useSnackbar";
import { addUser } from "../../../../../redux/addUserSlice";
import { RefreshToken } from "../../../../../redux/authSlice";
import { filterInput, validateField, getMaxLength } from "../../../../../utils/fieldValidation";
import axios from "axios";

const Schools = (props) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { displaySnackbar } = useSnackbar();
  const { accessToken, refreshToken, tokenExpiry, userRole } = useSelector((state) => state.login)
  const [errors, setErrors] = useState({});
  const [isEditMode, setIsEditMode] = useState(false);
  const [userData, setUserData] = React.useState({
    userRole: "SCHOOL", city: "", name: "", emailId: "", mobileNumber: "", state: "", address: "",
    schoolCode: "", principalName: "", postalCode: "", userId: ""
  })

  // Check if edit data is passed via props
  useEffect(() => {
    if (props.editData) {
      setIsEditMode(true);
      setUserData({
        userRole: "SCHOOL",
        userId: props.editData.userId || props.editData.id || "",
        name: props.editData.schoolName || props.editData.name || "",
        emailId: props.editData.email || props.editData.emailId || "",
        mobileNumber: props.editData.mobileNumber || "",
        city: props.editData.city || "",
        state: props.editData.state || "",
        address: props.editData.address || "",
        schoolCode: props.editData.schoolCode || "",
        principalName: props.editData.principalName || "",
        postalCode: props.editData.postalCode || ""
      });
    }
  }, [props.editData]);
  
  const handleFieldsChange = (e, fieldName) => {
    e.preventDefault()
    const rawValue = e.target.value;
    const filteredValue = filterInput(rawValue, fieldName);
    
    setUserData(current => {
      const copy = { ...current }
      copy[fieldName] = filteredValue
      return copy
    })
    
    // Validate on change
    const validation = validateField(filteredValue, fieldName);
    setErrors(prev => ({
      ...prev,
      [fieldName]: validation.isValid ? '' : validation.errorMessage
    }))
  }

  // Validate all required fields before save
  const validateForm = () => {
    const newErrors = {};
    
    // Validate school name
    if (!userData.name || userData.name.trim().length === 0) {
      newErrors.name = "School name is required";
    } else if (userData.name.length > 40) {
      newErrors.name = "School name must not exceed 40 characters";
    }
    
    // Validate principal name
    if (!userData.principalName || userData.principalName.trim().length === 0) {
      newErrors.principalName = "Principal name is required";
    } else if (userData.principalName.length > 40) {
      newErrors.principalName = "Principal name must not exceed 40 characters";
    }
    
    // Validate email
    if (!userData.emailId || userData.emailId.trim().length === 0) {
      newErrors.emailId = "Email is required";
    } else {
      const emailValidation = validateField(userData.emailId, 'emailId');
      if (!emailValidation.isValid) {
        newErrors.emailId = emailValidation.errorMessage;
      }
    }
    
    // Validate mobile number
    if (!userData.mobileNumber || userData.mobileNumber.trim().length === 0) {
      newErrors.mobileNumber = "Mobile number is required";
    } else {
      const cleanMobile = userData.mobileNumber.replace(/\D/g, '');
      if (cleanMobile.length !== 10) {
        newErrors.mobileNumber = "Mobile number must be exactly 10 digits";
      }
    }
    
    // Optional field validations
    if (userData.address && userData.address.length > 100) {
      newErrors.address = "Address must not exceed 100 characters";
    }
    if (userData.city && userData.city.length > 35) {
      newErrors.city = "City must not exceed 35 characters";
    }
    if (userData.state && userData.state.length > 35) {
      newErrors.state = "State must not exceed 35 characters";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }
  
  // Function handle generation of new School or update existing
  const handleSave = async () => {
    // Validate form before submission
    if (!validateForm()) {
      displaySnackbar({ message: 'Please fix the validation errors' })
      return;
    }
    
    let header = {
      "Content-Type": "application/json",
      'Accept': 'application/json',
      "Authorization": `Bearer ${accessToken}`
    }

    if (isEditMode) {
      // Update existing school
      try {
        const updateData = {
          name: userData.name,
          mobile_number: userData.mobileNumber,
          city: userData.city,
          state: userData.state,
          address: userData.address,
          postal_code: userData.postalCode,
          principal_name: userData.principalName
        };
        
        const response = await axios.put(
          `${process.env.REACT_APP_BACKEND_URL}/api/rest/users/${userData.userId}`,
          updateData,
          { headers: header }
        );
        
        if (response.data) {
          displaySnackbar({ message: 'School updated successfully' });
          if (props.onSchoolAdded) {
            props.onSchoolAdded();
          }
          props.handleCancel();
        }
      } catch (error) {
        displaySnackbar({ message: error.response?.data?.detail || 'Failed to update school' });
      }
    } else {
      // Create new school
      let data = { ...userData }
      const schoolCode = data.schoolCode || '';
      const postalCode = data.postalCode || '';
      const name = data.name || '';
      data.schoolCode = `SC${schoolCode.startsWith('SC') ? schoolCode.substring(2) : schoolCode}${postalCode.slice(-3)}${name.slice(0, 2).toUpperCase()}`
      dispatch(addUser({
        headers: header,
        body: data
      })).then((res) => {
        if (res.payload?.addedBy || res.payload?.userId) {
          displaySnackbar({ message: 'School added successfully. Login credentials sent to their email.' })
          setUserData({
            userRole: userRole, city: "", name: "", emailId: "", mobileNumber: "", state: "", address: "",
            schoolCode: "", principalName: "", postalCode: ""
          })
          setErrors({});
          if (props.onSchoolAdded) {
            props.onSchoolAdded();
          }
        } else if (res.payload?.error) {
          displaySnackbar({ message: res.payload.error })
        } else if (res.payload?.detail) {
          displaySnackbar({ message: res.payload.detail })
        } else if (res.payload?.message) {
          const msg = res.payload.message.split('.')[0]
          displaySnackbar({ message: msg })
        }
        if (res.payload?.message === "Expired JWT") {
          dispatch(RefreshToken({
            headers: header,
            body: { "refreshToken": refreshToken }
          })).then((res) => {
            if (res.payload?.accessToken) {
              header["Authorization"] = `Bearer ${res.payload.accessToken}`
              dispatch(addUser({
                headers: header,
                body: data
              })).then((innerRes) => {
                if (innerRes.payload?.userId) {
                  displaySnackbar({ message: 'School added successfully' })
                  if (props.onSchoolAdded) {
                    props.onSchoolAdded();
                  }
                }
              })
            }
          })
        }
      })
    }
  }
  return (
    <div className="addStudentManinContainer">
      <div className="addStudentContainer">
        <div className="addStudentHeaderTxtContainer">
          <img src={home} />
          <Typography fontSize="15px" fontWeight="bold" className="schoolText">
            {isEditMode ? "Edit School" : "Add New School"}
          </Typography>
        </div>
        <div className="addStudentHeaderBtnContainer">
          <BrowserView>
            <Button variant="outlined" className="cancelBtn" onClick={props.handleCancel}>Cancel</Button>
          </BrowserView>
          <MobileView>
            <Btn onClick={() => navigate(-1)} />
          </MobileView>
          <Button style={{ backgroundColor: "#B3DAFF" }} className="saveDataBtn" onClick={handleSave}>
            {isEditMode ? "Update" : "Save Data"}
          </Button>
        </div>
      </div>
      <form className="addNewSchoolContainer">
        <Paper className="addTextfieldContainer"
          style={{ backgroundColor: "white", borderRadius: '20px' }}
        >
          <div className="AddStudentTextFieldContainer">
            <MSTextField
              id="schoolName" type="text" placeholder="Enter school name"
              value={userData.name}
              label="* School Name" onChange={handleFieldsChange} fieldName="name"
              inputProps={{ maxLength: 40 }}
              error={!!errors.name}
              helperText={errors.name || "Max 40 characters"}
            />
            <MSTextField
              id="schoolPrincipalName" type="text" placeholder="Enter principal's full name"
              value={userData.principalName}
              label="* Principal's Name" onChange={handleFieldsChange} fieldName="principalName"
              inputProps={{ maxLength: 40 }}
              error={!!errors.principalName}
              helperText={errors.principalName || "Max 40 characters, alphabets only"}
            />
            <MSTextField
              id="schoolEmailId" type="email" placeholder="Enter Email"
              value={userData.emailId}
              label="* Email" onChange={handleFieldsChange} fieldName="emailId"
              inputProps={{ maxLength: 30 }}
              error={!!errors.emailId}
              helperText={errors.emailId || "Max 30 characters"}
              disabled={isEditMode}
            />
          </div>
          <div className="AddStudentTextFieldContainer">
            <MSTextField
              id="schoolCity" type="text" placeholder="Enter city name"
              value={userData.city}
              label="City" onChange={handleFieldsChange} fieldName="city"
              inputProps={{ maxLength: 35 }}
              error={!!errors.city}
              helperText={errors.city || "Max 35 characters, alphabets only"}
            />
            <MSTextField
              id="schoolState" type="text" placeholder="Enter State"
              value={userData.state}
              label="State" onChange={handleFieldsChange} fieldName="state"
              inputProps={{ maxLength: 35 }}
              error={!!errors.state}
              helperText={errors.state || "Max 35 characters, alphabets only"}
            />
            <MSTextField
              id="schoolMobileNumber" type="tel" placeholder="+91 Enter mobile number"
              value={userData.mobileNumber}
              label="* Mobile Number" onChange={handleFieldsChange} fieldName="mobileNumber"
              inputProps={{ maxLength: 10 }}
              error={!!errors.mobileNumber}
              helperText={errors.mobileNumber || "10 digits only"}
            />
          </div>
          <div className="AddStudentTextFieldContainer">
            <MSTextField
              id="schoolCode" type="text" placeholder="Enter School Code"
              value={userData.schoolCode}
              label="School Code" onChange={handleFieldsChange} fieldName="schoolCode"
              inputProps={{ maxLength: 16 }}
              error={!!errors.schoolCode}
              helperText={errors.schoolCode || "Max 16 characters, alphanumeric"}
              disabled={isEditMode}
            />
            <MSTextField
              id="postalCode" type="text" placeholder="Enter Postal Code"
              value={userData.postalCode}
              label="Postal Code" onChange={handleFieldsChange} fieldName="postalCode"
              inputProps={{ maxLength: 6 }}
              error={!!errors.postalCode}
              helperText={errors.postalCode || "6 digits"}
            />
          </div>
          <div>
            <MSTextField
              id="schoolAddress" type="text" placeholder="Enter complete address here"
              value={userData.address}
              label="Address" onChange={handleFieldsChange} fieldName="address"
              inputProps={{ maxLength: 100 }}
              error={!!errors.address}
              helperText={errors.address || "Max 100 characters"}
            />
          </div>
        </Paper>
      </form>
    </div>
  );
};
export default Schools;
