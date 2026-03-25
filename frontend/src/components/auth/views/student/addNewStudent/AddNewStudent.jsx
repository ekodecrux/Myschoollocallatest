import { Button, Paper, Typography } from "@mui/material";
import React, { useEffect, useState } from "react";
import { BrowserView, MobileView } from "react-device-detect";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import StudentsIcon from "../../../../../assests/auth/studentsIcon.svg";
import Btn from "../../../../../customTheme/button/Button";
import MSTextField from "../../../../../customTheme/textField/MSTextField";
import { addUser } from "../../../../../redux/addUserSlice";
import "./AddNewStudent.css";
import { useSnackbar } from "../../../../../hook/useSnackbar";
import { RefreshToken } from "../../../../../redux/authSlice";
import { filterInput, validateField, getMaxLength } from "../../../../../utils/fieldValidation";
import axios from "axios";

const AddNewStudent = (props) => {
  const { accessToken, refreshToken, tokenExpiry, userRole } = useSelector((state) => state.login)
  const { userDetails } = useSelector((state) => state.myProfile)
  const { displaySnackbar } = useSnackbar()
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [errors, setErrors] = useState({});
  const [isEditMode, setIsEditMode] = useState(false);
  const [userData, setUserData] = React.useState({
    userRole: "STUDENT", city: "", name: "", emailId: "", mobileNumber: "", schoolName: "", address: "",
    state: "", fatherName: "", rollNumber: "", className: "", sectionName: "", teacherCode: "",
    schoolCode: "", teacherName: ""
  })

  // Pre-populate form when editing an existing student
  useEffect(() => {
    if (props.editingStudent) {
      setIsEditMode(true);
      const student = props.editingStudent;
      setUserData({
        userRole: "STUDENT",
        userId: student.userId || student.id,
        name: student.name || '',
        emailId: student.email || student.emailId || '',
        mobileNumber: student.mobileNumber || student.mobile_number || '',
        address: student.address || '',
        city: student.city || '',
        state: student.state || '',
        schoolCode: student.schoolCode || student.school_code || '',
        schoolName: student.schoolName || student.school_name || '',
        teacherCode: student.teacherCode || student.teacher_code || '',
        teacherName: student.teacherName || student.teacher_name || '',
        fatherName: student.fatherName || student.father_name || '',
        rollNumber: student.rollNumber || student.roll_number || '',
        className: student.className || student.class_name || '',
        sectionName: student.sectionName || student.section_name || ''
      });
    }
  }, [props.editingStudent]);

  // Auto-populate school code, school name, teacher code, and teacher name (only when adding new)
  useEffect(() => {
    if (!props.editingStudent && userRole === "SCHOOL_ADMIN" && userDetails) {
      setUserData(current => ({
        ...current,
        schoolCode: userDetails.school_code || '',
        schoolName: userDetails.school_name || userDetails.name || ''
      }));
    }
    if (!props.editingStudent && userRole === "TEACHER" && userDetails) {
      setUserData(current => ({
        ...current,
        schoolCode: userDetails.school_code || '',
        schoolName: userDetails.school_name || '',
        teacherCode: userDetails.teacher_code || '',
        teacherName: userDetails.name || ''
      }));
    }
  }, [userRole, userDetails, props.editingStudent]);

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
    
    // Validate required student fields
    // Roll number is optional
    if (userData.rollNumber && userData.rollNumber.length > 10) {
      newErrors.rollNumber = "Roll number must not exceed 10 characters";
    }
    
    if (!userData.className || userData.className.trim().length === 0) {
      newErrors.className = "Class name is required";
    } else if (userData.className.length > 10) {
      newErrors.className = "Class name must not exceed 10 characters";
    }
    
    if (!userData.sectionName || userData.sectionName.trim().length === 0) {
      newErrors.sectionName = "Section is required";
    } else if (userData.sectionName.length > 10) {
      newErrors.sectionName = "Section must not exceed 10 characters";
    }
    
    // Parent Name is mandatory
    if (!userData.fatherName || userData.fatherName.trim().length === 0) {
      newErrors.fatherName = "Parent name is required";
    } else if (userData.fatherName.length > 40) {
      newErrors.fatherName = "Parent name must not exceed 40 characters";
    }
    
    // School Code and Teacher Code are MANDATORY for Super Admin adding students
    if (userRole === "SUPER_ADMIN") {
      if (!userData.schoolCode || userData.schoolCode.trim().length === 0) {
        newErrors.schoolCode = "School Code is required";
      }
    }
    
    // Teacher Code is optional for all roles
    if (userData.teacherCode && userData.teacherCode.length > 16) {
      newErrors.teacherCode = "Teacher code must not exceed 16 characters";
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
    // Postal code is optional
    if (userData.postalCode && userData.postalCode.length > 6) {
      newErrors.postalCode = "Postal code must be 6 digits";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }
  
  // Function handle generation of new Student or update existing
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
            state: userData.state,
            fatherName: userData.fatherName,
            rollNumber: userData.rollNumber,
            className: userData.className,
            sectionName: userData.sectionName,
            teacherCode: userData.teacherCode
          },
          { headers: header }
        );
        displaySnackbar({ message: 'Student updated successfully' });
        if (props.onStudentAdded) {
          props.onStudentAdded();
        }
      } catch (error) {
        displaySnackbar({ message: error.response?.data?.detail || 'Failed to update student' });
      }
      return;
    }
    
    let data = { ...userData }
    // Don't modify school code prefix - backend handles this
    dispatch(addUser({
      headers: header,
      body: data
    })).then((res) => {
      if (res.payload?.addedBy || res.payload?.userId) {
        displaySnackbar({ message: 'Student added successfully. Login credentials sent to their email.' })
        setUserData({
          userRole: userRole, city: "", name: "", emailId: "", mobileNumber: "", schoolName: "", address: "",
          state: "", fatherName: "", rollNumber: "", className: "", sectionName: "", teacherCode: "",
          schoolCode: ""
        })
        // Call the callback to refresh the list and return to list view
        if (props.onStudentAdded) {
          props.onStudentAdded();
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
            body: data
          })).then((res) => {
            if (res.payload?.userId) {
              displaySnackbar({ message: 'Student added successfully' })
              setUserData({
                userRole: userRole, city: "", name: "", emailId: "", mobileNumber: "", schoolName: "", address: "",
                state: "", fatherName: "", rollNumber: "", className: "", sectionName: "", teacherCode: "",
                schoolCode: ""
              })
              // Call the callback to refresh the list and return to list view
              if (props.onStudentAdded) {
                props.onStudentAdded();
              }
            }
          })
        })
      }
    })
    // } else {
    //   displaySnackbar({ message:newMessage});
    // }
  }
  return (
    <div className="addStudentManinContainer">
      <div className="addStudentContainer">
        <div className="addStudentHeaderTxtContainer">
          <img src={StudentsIcon} alt="students icon" />
          <Typography fontSize="15px" fontWeight="bold">
            {isEditMode ? 'Edit Student' : 'Add New Student'}
          </Typography>
        </div>
        <div className="addStudentHeaderBtnContainer">
          <BrowserView>
            <Button variant="outlined" className="cancelBtn" onClick={props.handleCancel}>Cancel</Button>
          </BrowserView>
          <MobileView>
            <Btn onclick={() => navigate(-1)} />
          </MobileView>
          <Button style={{ backgroundColor: "#B3DAFF" }} className="saveDataBtn" onClick={handleSave}>
            {isEditMode ? 'Update Data' : 'Save Data'}
          </Button>
        </div>
      </div>
      <form className="addNewStudentContainer">
        <Paper
          className="AddFormContainer"
          style={{ backgroundColor: "white" }}
        >
          <div className="addTextfieldContainer">
            <div className="AddStudentTextFieldContainer">
              <MSTextField
                id="studentUserName" type="text" placeholder="Enter your user name"
                value={userData.name}
                label="* User Name" onChange={handleFieldsChange} fieldName="name"
                inputProps={{ maxLength: 40 }}
                error={!!errors.name}
                helperText={errors.name || "Max 40 characters, alphabets only"}
              />
              <MSTextField
                id="studentEmailId" type="email" placeholder="student@email.com"
                value={userData.emailId}
                label="* Email ID " onChange={handleFieldsChange} fieldName="emailId"
                inputProps={{ maxLength: 30 }}
                error={!!errors.emailId}
                helperText={errors.emailId || "Max 30 characters"}
                disabled={isEditMode}
              />
              <MSTextField
                id="studentMobileNumber" type="tel" placeholder="Parent Mobile Number"
                value={userData.mobileNumber}
                label="* Parent Mobile Number" onChange={handleFieldsChange} fieldName="mobileNumber"
                inputProps={{ maxLength: 10 }}
                error={!!errors.mobileNumber}
                helperText={errors.mobileNumber || "10 digits only"}
              />
            </div>
            <div className="AddStudentTextFieldContainer">
              <MSTextField
                id="studentAddress" type="text" placeholder="Enter your Address"
                value={userData.address}
                label="Address" onChange={handleFieldsChange} fieldName="address"
                inputProps={{ maxLength: 100 }}
                error={!!errors.address}
                helperText={errors.address || "Max 100 characters"}
              />
              <MSTextField
                id="studentCity" type="text" placeholder="City"
                value={userData.city}
                label="City" onChange={handleFieldsChange} fieldName="city"
                inputProps={{ maxLength: 35 }}
                error={!!errors.city}
                helperText={errors.city || "Max 35 characters, alphabets only"}
              />
              <MSTextField
                id="studentFatherName" type="text" placeholder="Parent Name ex. Aman Kumar"
                value={userData.fatherName}
                label={<><span style={{color: 'red'}}>* </span>Parent Name</>} onChange={handleFieldsChange} fieldName="fatherName"
                inputProps={{ maxLength: 40 }}
                error={!!errors.fatherName}
                helperText={errors.fatherName || "Required. Max 40 characters, alphabets only"}
              />
            </div>
            <div className="AddStudentTextFieldContainer">
              <MSTextField
                id="studentState" type="text" placeholder="State"
                value={userData.state}
                label="State" onChange={handleFieldsChange} fieldName="state"
                inputProps={{ maxLength: 35 }}
                error={!!errors.state}
                helperText={errors.state || "Max 35 characters, alphabets only"}
              />
              <MSTextField
                id="studentRollNumber" type="text" placeholder="Roll Number ex. 123321"
                value={userData.rollNumber}
                label="* Roll Number" onChange={handleFieldsChange} fieldName="rollNumber"
                inputProps={{ maxLength: 10 }}
                error={!!errors.rollNumber}
                helperText={errors.rollNumber || "Max 10 characters, alphanumeric"}
              />
            </div>
            <div
              className="AddStudentTextFieldContainer">
              <MSTextField
                id="studentClassName" type="text" placeholder="Class Name ex. 11th,4th"
                value={userData.className}
                label="* Class Name" onChange={handleFieldsChange} fieldName="className"
                inputProps={{ maxLength: 10 }}
                error={!!errors.className}
                helperText={errors.className || "Max 10 characters"}
              />
              <MSTextField
                id="studentSectionName" type="text" placeholder="Section ex. A, B, C"
                value={userData.sectionName}
                label="* Section" onChange={handleFieldsChange} fieldName="sectionName"
                inputProps={{ maxLength: 10 }}
                error={!!errors.sectionName}
                helperText={errors.sectionName || "Max 10 characters, alphabets only"}
              />
            </div>
            <div className="AddStudentTextFieldContainer">
              {/* Show auto-populated school info for School Admin */}
              {userRole === "SCHOOL_ADMIN" && (userData.schoolCode || userData.schoolName) ?
                <>
                  <MSTextField
                    id="studentSchoolName" type="text" placeholder="School Name"
                    value={userData.schoolName}
                    label="School Name"
                    disabled={true}
                  />
                  <MSTextField
                    id="studentSchoolCode" type="text" placeholder="School Code"
                    value={userData.schoolCode}
                    label="School Code"
                    disabled={true}
                  />
                </> : null}
              {userRole === "SCHOOL_ADMIN" ?
                <MSTextField
                  id="studentTeacherCode" type="text" placeholder="Teacher code ex. 1665709456231"
                  value={userData.teacherCode}
                  label="Teacher Code" onChange={handleFieldsChange} fieldName="teacherCode"
                /> : null}
              {/* Show auto-populated codes for Teacher */}
              {userRole === "TEACHER" && (userData.schoolCode || userData.teacherCode) ?
                <>
                  <MSTextField
                    id="studentSchoolName" type="text" placeholder="School Name"
                    value={userData.schoolName}
                    label="School Name"
                    disabled={true}
                  />
                  <MSTextField
                    id="studentSchoolCode" type="text" placeholder="School Code"
                    value={userData.schoolCode}
                    label="School Code"
                    disabled={true}
                  />
                  <MSTextField
                    id="studentTeacherName" type="text" placeholder="Teacher Name"
                    value={userData.teacherName}
                    label="Teacher Name"
                    disabled={true}
                  />
                  <MSTextField
                    id="studentTeacherCode" type="text" placeholder="Teacher Code"
                    value={userData.teacherCode}
                    label="Teacher Code"
                    disabled={true}
                  />
                </> : null}
              {userRole === "SUPER_ADMIN" ?
                <>
                  <MSTextField
                    id="studentSchoolCode" type="text" placeholder="School Code ex. SCH123456"
                    value={userData.schoolCode}
                    label="* School Code" onChange={handleFieldsChange} fieldName="schoolCode"
                    error={!!errors.schoolCode}
                    helperText={errors.schoolCode || "Required - Enter valid school code"}
                  />
                  <MSTextField
                    id="studentTeacherCode" type="text" placeholder="Teacher code ex. TCH123456"
                    value={userData.teacherCode}
                    label="* Teacher Code" onChange={handleFieldsChange} fieldName="teacherCode"
                    error={!!errors.teacherCode}
                    helperText={errors.teacherCode || "Required - Enter valid teacher code"}
                  />
                </> : null}
            </div>
          </div>
        </Paper>
      </form>
    </div>
  );
};
export default AddNewStudent;
