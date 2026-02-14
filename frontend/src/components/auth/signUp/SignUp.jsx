import { Button, Card, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, Typography, Select, MenuItem, FormControl, InputLabel } from "@mui/material";
import React, { useEffect, useState } from "react";
import { isMobile } from "react-device-detect";
import ScrollMenuBtn from "../../../customTheme/signUpMenu/index";
import MSTextField from "../../../customTheme/textField/MSTextField";
import "./SignUp.css";
import { authRegister } from "../../../redux/authSlice";
import { useDispatch, useSelector } from "react-redux";
import { userLogin } from "../../../redux/authSlice";
import { useNavigate } from "react-router-dom";
import { useSnackbar } from "../../../hook/useSnackbar";
import { ReactComponent as Crossicon } from "../../../assests/homeScreen/crossicon.svg";
import { ReactComponent as MySchool } from "../../../assests/homeScreenLogo.svg";
import formValidation from "../../../formValidation/validation"
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import axios from "axios";
import { formFields } from './constant'
export const SignUp = React.forwardRef((props, ref) => {
  const [userRole, setUserRole] = useState("Student");
  const [error, setError] = React.useState(false);
  const navigate = useNavigate();
  const { refreshToken, accessToken } = useSelector((state) => state.login);
  const [loading, setLoading] = React.useState(false);
  const signUpContainerRef = React.useRef(null)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [activeSchools, setActiveSchools] = useState([]);
  const { displaySnackbar } = useSnackbar();
  const [userData, setUserData] = useState({
    userRole: userRole?.toLocaleUpperCase(),
    city: "",
    confirmPassword: "",
    password: "",
    name: "",
    emailId: "",
    mobileNumber: "",
    schoolCode: "",
    postalCode: "",
    schoolName: "",
  });
  const dispatch = useDispatch();
  // Fetch active schools for dropdown
  useEffect(() => {
    const fetchSchools = async () => {
      try {
        const backendUrl = process.env.REACT_APP_BACKEND_URL;
        const response = await axios.get(`${backendUrl}/api/rest/schools/public/active`);
        if (response.data?.schools) {
          setActiveSchools(response.data.schools);
        }
      } catch (err) {
        console.error("Failed to fetch schools:", err);
      }
    };
    fetchSchools();
  }, []);
  const handleLoginNav = (e) => {
    props.changeTab();
  };
  const handleFieldsChange = (e, fieldName) => {
    e.preventDefault();
    setUserData((current) => {
      const copy = { ...current };
      copy[fieldName] = e.target.value;
      return copy;
    });
  };
  const handleUserRegister = () => {
    // Get required fields from form definition (fields with * in label)
    const currentFormFields = formFields[userRole] || [];
    const requiredFieldNames = currentFormFields
      .filter(field => field.label && typeof field.label === 'object' && field.fieldName)
      .map(field => field.fieldName);
    
    // Field name to display label mapping
    const fieldLabels = {
      name: userRole === 'School' ? 'School Name' : 'User Name',
      schoolCode: 'School Code',
      principalName: 'Principal Name',
      mobileNumber: userRole === 'Student' ? 'Parent Mobile Number' : 'Mobile Number',
      emailId: 'Email Id',
      postalCode: 'Postal Code',
      password: 'Password',
      confirmPassword: 'Confirm Password',
      className: 'Class Name',
      rollNumber: 'Roll Number',
      sectionName: 'Section',
      fatherName: 'Parent Name',
      teacherCode: 'Teacher Code'
    };
    
    // Check for empty required fields
    const missingFields = [];
    for (const field of requiredFieldNames) {
      if (!userData[field] || userData[field].toString().trim() === '') {
        missingFields.push(fieldLabels[field] || field);
      }
    }
    
    if (missingFields.length > 0) {
      if (missingFields.length === 1) {
        displaySnackbar({ message: `Please fill in: ${missingFields[0]}` });
      } else if (missingFields.length <= 3) {
        displaySnackbar({ message: `Please fill in: ${missingFields.join(', ')}` });
      } else {
        displaySnackbar({ message: `Please fill in all required fields (${missingFields.length} fields missing)` });
      }
      return;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userData.emailId)) {
      displaySnackbar({ message: 'Please enter a valid email address' });
      return;
    }
    
    // Validate mobile number (should be 10 digits)
    const mobileClean = userData.mobileNumber?.replace(/\D/g, '');
    if (!mobileClean || mobileClean.length < 10) {
      displaySnackbar({ message: 'Please enter a valid mobile number (10 digits)' });
      return;
    }
    
    // Validate password
    if (!userData.password || userData.password.length < 6) {
      displaySnackbar({ message: 'Password must be at least 6 characters long' });
      return;
    }
    
    // Validate confirm password
    if (userData.password !== userData.confirmPassword) {
      displaySnackbar({ message: 'Passwords do not match' });
      return;
    }
    
    setLoading(true);
    let header = {
      "Content-Type": "application/json",
    };
    
    let data = Object.assign({}, userData);
    data.userRole = userRole.toUpperCase();
    
    try {
      if (userRole === "School") {
        const schoolCode = (data.schoolCode || '').slice(0, 8);  // Limit to 8 chars to keep total <= 16
        const postalCode = data.postalCode || '';
        const name = data.name || '';
        // Format: SC + schoolCode(8) + postal(3) + name(2) = max 15 chars
        const generatedCode = `SC${schoolCode.startsWith('SC') ? schoolCode.substring(2) : schoolCode}${postalCode.slice(-3)}${name.slice(0, 2).toUpperCase()}`;
        data.schoolCode = generatedCode.slice(0, 16);  // Ensure max 16 chars
      } else if (userRole === "Teacher" || userRole === "Student") {
        const schoolCode = data.schoolCode || '';
        data.schoolCode = `SC${schoolCode.startsWith('SC') ? schoolCode.substring(2) : schoolCode}`.slice(0, 16);
        if (userRole === "Student") {
          const teacherCode = data.teacherCode || '';
          data.teacherCode = `TR${teacherCode.startsWith('TR') ? teacherCode.substring(2) : teacherCode}`.slice(0, 16);
        }
      }
    } catch (err) {
      displaySnackbar({ message: 'Please fill in all required fields correctly' });
      setLoading(false);
      return;
    }
    
    dispatch(
      authRegister({
        url: "/auth/register",
        header: header,
        method: "POST",
        body: data,
      })
    ).then((res) => {
      if ((res.payload?.addedBy === "Self" && res.payload?.userId) || 
          (res.payload?.message === "Registration successful" && res.payload?.userId)) {
        // Show success dialog instead of auto-login
        setShowSuccessDialog(true);
        displaySnackbar({ message: "Registration successful! Please sign in to continue." });
      } else if (res.payload?.message && res.payload?.message !== "Registration successful") {
        const message = res.payload.message;
        const msg_remove = message.split(".");
        const msg = msg_remove[0];
        displaySnackbar({ message: msg });
      } else {
        // Handle validation errors from backend
        let errorMsg = 'Registration failed';
        const detail = res.payload?.detail;
        if (Array.isArray(detail) && detail.length > 0) {
          // Pydantic validation error format
          const firstError = detail[0];
          const fieldName = firstError.loc?.[1] || 'field';
          errorMsg = `${fieldName}: ${firstError.msg || 'Invalid value'}`;
        } else if (typeof detail === 'string') {
          errorMsg = detail;
        } else if (res.payload?.error) {
          errorMsg = typeof res.payload.error === 'string' ? res.payload.error : 'Registration failed';
        }
        displaySnackbar({ message: errorMsg });
      }
      setLoading(false);
    }).catch((err) => {
      displaySnackbar({ message: 'Registration failed. Please try again.' });
      setLoading(false);
    });
  };
  const handleSuccessSignIn = () => {
    setShowSuccessDialog(false);
    // Clear the form data
    setUserData({
      userRole: userRole?.toLocaleUpperCase(),
      city: "",
      confirmPassword: "",
      password: "",
      name: "",
      emailId: "",
      mobileNumber: "",
      schoolCode: "",
      postalCode: "",
      schoolName: "",
    });
    props.changeTab(); // Switch to Sign In tab
  };
  const handleSuccessCancel = () => {
    setShowSuccessDialog(false);
    // Clear the form data
    setUserData({
      userRole: userRole?.toLocaleUpperCase(),
      city: "",
      confirmPassword: "",
      password: "",
      name: "",
      emailId: "",
      mobileNumber: "",
      schoolCode: "",
      postalCode: "",
      schoolName: "",
    });
    props.handleCloseModal();
  };
  React.useEffect(() => {
    if (accessToken && refreshToken) {
      navigate("/auth");
    }
    if (userRole.length === 0) {
      setError(true);
    }
  }, [accessToken, refreshToken]);
  return (
    <>
      <div className="loginParentCard registerParentCard">
        <Card style={{ display: 'flex', flex: 1, flexDirection: 'column', maxHeight: "80vh", minWidth: isMobile ? '100vw' : 'unset', position: 'relative' }}>
          {/* Close button inside the card */}
          <div style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            display: 'flex',
            backgroundColor: '#f5f5f5',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 10
          }}>
            <Crossicon
              onClick={() => props.handleCloseModal()}
              style={{ width: '16px', height: '16px' }}
            />
          </div>
          <div className="signupNav">
            {isMobile ? null :
              <div className="loginNewLogoContainer">
                <MySchool className="loginMySchoolLogo" />
              </div>
            }
            <div className={isMobile ? '' : "loginBtnContainer"} >
              <Button variant="text" onClick={handleLoginNav}>
                {" "}
                Sign In{" "}
              </Button>
              <Button
                variant="contained"
                color="secondary"
                className="loginTabBtn"
              >
                Register
              </Button>
            </div>
          </div>
          <div className="SignUpHeading">
            <h3>Register To Get Exclusive Benefits</h3>
            <p style={{color: '#5FCBF3', fontWeight: 'bold', margin: '5px 0'}}>🎁 Get 100 FREE Credits on Sign Up!</p>
          </div>
          <div className="roleSelector">
            <div style={{ maxWidth: "-webkit-fill-available" }}>
              <ScrollMenuBtn setUserRole={setUserRole} userRole={userRole} />
            </div>
          </div>
          <form className="registerForm">
            <div className="signUpInputContainer" ref={signUpContainerRef}>
              {formFields[userRole].map((k, i) => {
                return (
                  <MSTextField
                    key={i}
                    style={{
                      flex: 1,
                      minWidth: 300,
                    }}
                    id={`register-${k.fieldName}`}
                    type={k.type}
                    onChange={handleFieldsChange}
                    fieldName={k.fieldName}
                    placeholder={k.type === "email" ?
                      `${userRole.toLocaleLowerCase()}@email.com` : k.placeholder}
                    label={k.label}
                  />
                );
              })}
            </div>
            <div className="loginContBtn registerContBtn" style={{ display: 'flex', gap: '16px', marginTop: '10px' }}>
              {!loading ? (
                <>
                  <Button
                    variant="outlined"
                    color="inherit"
                    disableRipple
                    disableFocusRipple
                    disableElevation
                    onClick={() => props.handleCloseModal()}
                    sx={{ 
                      flex: 1, 
                      minWidth: '120px',
                      borderWidth: '2px',
                      borderColor: '#ccc',
                      color: '#333',
                      marginRight: '8px',
                      transition: 'background-color 0.2s, border-color 0.2s',
                      '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.04)',
                        borderColor: '#999',
                      },
                      '&:focus': {
                        outline: 'none',
                        boxShadow: 'none',
                        backgroundColor: 'transparent',
                      },
                      '&:active': {
                        backgroundColor: 'rgba(0, 0, 0, 0.08)',
                      },
                      '&.Mui-focusVisible': {
                        outline: 'none',
                        boxShadow: 'none',
                      }
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="contained"
                    color="secondary"
                    disableRipple
                    disableFocusRipple
                    disableElevation
                    onClick={handleUserRegister}
                    sx={{ 
                      flex: 1, 
                      minWidth: '120px',
                      marginLeft: '8px',
                      transition: 'background-color 0.2s, transform 0.1s',
                      '&:hover': {
                        opacity: 0.9,
                      },
                      '&:focus': {
                        outline: 'none',
                        boxShadow: 'none',
                      },
                      '&:active': {
                        transform: 'scale(0.98)',
                      },
                      '&.Mui-focusVisible': {
                        outline: 'none',
                        boxShadow: 'none',
                      }
                    }}
                  >
                    Sign Up
                  </Button>
                </>
              ) : (
                <Button variant="contained" color="secondary" fullWidth>
                  <CircularProgress size={18} color="primary" />
                </Button>
              )}
            </div>
          </form>
        </Card>
      </div>
      {/* Success Dialog */}
      <Dialog 
        open={showSuccessDialog} 
        onClose={handleSuccessCancel}
        PaperProps={{
          style: {
            borderRadius: '16px',
            padding: '20px',
            textAlign: 'center'
          }
        }}
      >
        <DialogContent style={{ textAlign: 'center', paddingTop: '20px' }}>
          <CheckCircleOutlineIcon style={{ fontSize: 80, color: '#4CAF50', marginBottom: '16px' }} />
          <Typography variant="h5" style={{ fontWeight: 'bold', marginBottom: '8px' }}>
            Registration Successful!
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Your account has been created successfully. Please sign in to continue.
          </Typography>
        </DialogContent>
        <DialogActions style={{ justifyContent: 'center', padding: '16px 24px', gap: '12px' }}>
          <Button 
            variant="outlined" 
            onClick={handleSuccessCancel}
            style={{ minWidth: '100px' }}
          >
            Cancel
          </Button>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleSuccessSignIn}
            style={{ minWidth: '100px' }}
          >
            Sign In
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
});
