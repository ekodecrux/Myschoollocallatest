import { Button, Paper, Typography } from "@mui/material";
import React, { useState, useEffect } from "react";
import { BrowserView, MobileView } from "react-device-detect";
import { useNavigate } from "react-router-dom";
import TeachersIcon from "../../../../../assests/auth/teachersIcon.svg";
import Btn from "../../../../../customTheme/button/Button";
import MSTextField from "../../../../../customTheme/textField/MSTextField";
import "../../student/addNewStudent/AddNewStudent.css";
import { addUser } from "../../../../../redux/addUserSlice";
import { useDispatch, useSelector } from "react-redux";
import { useSnackbar } from "../../../../../hook/useSnackbar";
import { RefreshToken } from "../../../../../redux/authSlice";
import { filterInput, validateField, getMaxLength } from "../../../../../utils/fieldValidation";
import axios from "axios";

const Teachers = (props) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { displaySnackbar } = useSnackbar();
  const { accessToken, refreshToken, tokenExpiry, userRole } = useSelector((state) => state.login)
  const { userDetails } = useSelector((state) => state.myProfile)
  const [errors, setErrors] = useState({});
  const [isEditMode, setIsEditMode] = useState(false);
  const [userData, setUserData] = React.useState({
    userRole: "TEACHER", city: "", name: "", emailId: "", mobileNumber: "", state: "", address: "", schoolCode: "", schoolName: ""
  })

  // Pre-populate form when editing an existing teacher
  useEffect(() => {
    if (props.editingTeacher) {
      setIsEditMode(true);
      const teacher = props.editingTeacher;
      setUserData({
        userRole: "TEACHER",
        userId: teacher.userId || teacher.id,
        name: teacher.name || '',
        emailId: teacher.email || teacher.emailId || '',
        mobileNumber: teacher.mobileNumber || teacher.mobile_number || '',
        address: teacher.address || '',
        city: teacher.city || '',
        state: teacher.state || '',
        schoolCode: teacher.schoolCode || teacher.school_code || '',
        schoolName: teacher.schoolName || teacher.school_name || ''
      });
    }
  }, [props.editingTeacher]);

  // Auto-populate school code AND school name for School Admin (only when adding new)
  useEffect(() => {
    if (!props.editingTeacher && userRole === "SCHOOL_ADMIN" && userDetails) {
      setUserData(current => ({
        ...current,
        schoolCode: userDetails.school_code || '',
        schoolName: userDetails.school_name || userDetails.name || ''
      }));
    }
  }, [userRole, userDetails, props.editingTeacher]);

  const handleFieldsChange = (e, fieldName) => {
    e.preventDefault()
    const rawValue = e.target.value;
    // Filter input based on field validation rules
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
    
    // Validate name
    if (!userData.name || userData.name.trim().length === 0) {
      newErrors.name = "Name is required";
    } else if (userData.name.length > 40) {
      newErrors.name = "Name must not exceed 40 characters";
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
  
  // Function handle generation of new Teacher or update existing
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
    
    // If editing, use update endpoint
    if (isEditMode && userData.userId) {
      try {
        const response = await axios.patch(
          `${process.env.REACT_APP_BACKEND_URL}/api/rest/users/adminUpdateUser`,
          {
            userId: userData.userId,
            name: userData.name,
            mobileNumber: userData.mobileNumber,
            address: userData.address,
            city: userData.city,
            state: userData.state
          },
          { headers: header }
        );
        displaySnackbar({ message: 'Teacher updated successfully' });
        if (props.onTeacherAdded) {
          props.onTeacherAdded();
        }
      } catch (error) {
        displaySnackbar({ message: error.response?.data?.detail || 'Failed to update teacher' });
      }
      return;
    }
    
    // Otherwise, add new teacher
    dispatch(addUser({
      headers: header,
      body: userData
    })).then((res) => {
      if (res.payload?.addedBy || res.payload?.userId) {
        displaySnackbar({ message: 'Teacher added successfully. Login credentials sent to their email.' })
        setUserData({
          userRole: userRole, city: "", name: "", emailId: "", mobileNumber: "", state: "", address: "",
          schoolCode: "",
        })
        // Call the callback to refresh the list and return to list view
        if (props.onTeacherAdded) {
          props.onTeacherAdded();
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
          body: {
            "refreshToken": refreshToken
          }
        })).then((res) => {
          header["Authorization"] = `Bearer ${res.payload.accessToken}`
          dispatch(addUser({
            headers: header,
            body: userData
          })).then((res) => {
            if (res.payload?.addedBy || res.payload?.userId) {
              displaySnackbar({ message: 'Teacher added successfully' })
              setUserData({
                userRole: userRole, city: "", name: "", emailId: "", mobileNumber: "", state: "", address: "",
                schoolCode: "",
              })
              // Call the callback to refresh the list and return to list view
              if (props.onTeacherAdded) {
                props.onTeacherAdded();
              }
            } else if (res.payload?.message) {
              const msg = res.payload.message.split('.')[0]
              displaySnackbar({ message: msg })
            } else if (res.payload?.error) {
              displaySnackbar({ message: res.payload.error })
            }
          })
        })
      }
    })
    // } else {
    //   displaySnackbar({ message:newMessage});
    // }
    //     if (!validEmail.test(userData.emailId)) {
    //       setEmailErr(true);
    //    }
    //    if (!validmobileNumber.test(userData.mobileNumber)) {
    //     setPwdErr(true);
    //  }
    //  if (!validUserName.test(userData.name)) {
    //   setNameErr(true);
    // }
    // if(!validUserAddress.test(userData.address)){
    //   setAddErr(true);
    // }
    // if(!validCityName.test(userData.city)){
    //   setCityErr(true);
    // }
    // if(!validStateName.test(userData.state)){
    //   setStateErr(true);
    // }
    // if(!validSchoolCode.test(userData.schoolCode)){
    //   setSchoolErr(true);
    // }
  }
  return (
    <div className="addStudentManinContainer">
      <div className="addStudentContainer">
        <div className="addStudentHeaderTxtContainer">
          <img src={TeachersIcon} alt="teachers icon" />
          <Typography fontSize="15px" fontWeight="bold">
            {isEditMode ? 'Edit Teacher' : 'Add New Teacher'}
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
            {isEditMode ? 'Update Data' : 'Save Data'}
          </Button>
          {/* {emailErr && <p>Your email is invalid</p>} 
       {pwdErr && <p>Your Mobile Number is invalid</p>} 
       {nameErr && <p>UserName is invalid</p>} 
       {addErr && <p>Address is invalid</p>} 
       {cityErr && <p>City Name Is Invalid</p>}
       {stateErr && <p>State Name Is Invalid</p>}
       {schoolErr && <p>School Code Is Invalid</p>} */}
        </div>
      </div>
      <form className="addNewTeacherContainer">
        <Paper
          className="AddFormContainer"
          style={{ backgroundColor: "white" }}
        >
          <div className="addTextfieldContainer">
            <div className="AddStudentTextFieldContainer">
              <MSTextField id="teacherUsername" type="text" placeholder="Enter your user name"
                value={userData.name}
                label="* User Name" onChange={handleFieldsChange} fieldName="name"
                inputProps={{ maxLength: 40 }}
                error={!!errors.name}
                helperText={errors.name || "Max 40 characters, alphabets only"}
              />
              <MSTextField id="teacherEmail" type="email" placeholder="teacher@email.com"
                value={userData.emailId}
                label="* Email ID " onChange={handleFieldsChange} fieldName="emailId"
                inputProps={{ maxLength: 30 }}
                error={!!errors.emailId}
                helperText={errors.emailId || "Max 30 characters"}
                disabled={isEditMode}
              />
              <MSTextField id="teacherMobileNumber" type="tel" placeholder="Mobile Number"
                value={userData.mobileNumber}
                label="* Mobile Number" onChange={handleFieldsChange} fieldName="mobileNumber"
                inputProps={{ maxLength: 10 }}
                error={!!errors.mobileNumber}
                helperText={errors.mobileNumber || "10 digits only"}
              />
            </div>
            <div className="AddStudentTextFieldContainer">
              {/* <MSTextField id="teacherUsername" type="text" placeholder="School Name"
                label="* School Name" onChange={handleFieldsChange}
                fieldName="schoolName"
              /> */}
              <MSTextField id="teacherAddress" type="text" placeholder="Enter your Address"
                value={userData.address}
                label="Address" onChange={handleFieldsChange} fieldName="address"
                inputProps={{ maxLength: 100 }}
                error={!!errors.address}
                helperText={errors.address || "Max 100 characters"}
              />
              <MSTextField id="teacherCity" type="text" placeholder="City"
                value={userData.city}
                label="City" onChange={handleFieldsChange} fieldName="city"
                inputProps={{ maxLength: 35 }}
                error={!!errors.city}
                helperText={errors.city || "Max 35 characters, alphabets only"}
              />
              <MSTextField id="teacherState" type="text" placeholder="State"
                value={userData.state}
                label="State" onChange={handleFieldsChange} fieldName="state"
                inputProps={{ maxLength: 35 }}
                error={!!errors.state}
                helperText={errors.state || "Max 35 characters, alphabets only"}
              />
            </div>
            <div className="AddStudentTextFieldContainer">
              {userRole === "SUPER_ADMIN" ?
                <MSTextField id="teacherSchoolCode" type="text" placeholder="School Code ex. 123456789"
                  value={userData.schoolCode}
                  label="* School Code" onChange={handleFieldsChange} fieldName="schoolCode"
                /> : null}
              {userRole === "SCHOOL_ADMIN" && (userData.schoolCode || userData.schoolName) ?
                <>
                  <MSTextField id="teacherSchoolName" type="text" placeholder="School Name"
                    value={userData.schoolName}
                    label="School Name"
                    disabled={true}
                  />
                  <MSTextField id="teacherSchoolCode" type="text" placeholder="School Code"
                    value={userData.schoolCode}
                    label="School Code"
                    disabled={true}
                  />
                </> : null}
            </div>
          </div>
        </Paper>
      </form>
    </div>
  );
};
export default Teachers;
