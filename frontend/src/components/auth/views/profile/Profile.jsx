import { Avatar, Button, Card, Link, Paper, Stack, Typography } from "@mui/material";
import React, { useEffect } from "react";
import blacksetting from "../../../../assests/auth/blacksetting.svg";
import profileone from "../../../../assests/auth/profileone.svg";
import "./Profile.css";
import "../student/addNewStudent/AddNewStudent.css";
import MSTextField from "../../../../customTheme/textField/MSTextField";
import Btn from "../../../../customTheme/button/Button";
import { BrowserView, MobileView } from 'react-device-detect';
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { MyProfile, UpdateProfile } from "../../../../redux/myProfileSlice";
import { RefreshToken } from "../../../../redux/authSlice";
import { useSnackbar } from "../../../../hook/useSnackbar";
const Profile = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { userDetails } = useSelector((state) => state.myProfile)
  const { refreshToken, accessToken, tokenExpiry, userRole, appType } = useSelector((state) => state.login);
  const [userData, setUserData] = React.useState({})
  const [newPass, setNewPass] = React.useState("")
  const [confirmPass, setConfirmPass] = React.useState("")
  const { displaySnackbar } = useSnackbar();
  useEffect(() => {
    let header = {
      "Content-Type": "application/json",
      'Accept': 'application/json',
      "Authorization": `Bearer ${accessToken}`
    }
    let data = {}
    dispatch(MyProfile({
      headers: header,
      method: "GET",
      body: data
    })).then((res) => {
      if (res.payload.message === "Expired JWT") {
        dispatch(RefreshToken({
          headers: header,
          body: {
            "refreshToken": refreshToken
          }
        })).then((res) => {
          header["Authorization"] = `Bearer ${res.payload.accessToken}`
          dispatch(MyProfile({
            headers: header,
            method: "GET",
            body: data
          })).then((res) => {
            setUserData(res.payload)
          })
        })
      } else {
        setUserData(res.payload)
      }
    })
  }, [])
  const handleFieldsChange = (e, fieldName) => {
    e.preventDefault()
    setUserData(current => {
      const copy = { ...current }
      copy[fieldName] = e.target.value
      return copy
    })
  }
  const handleUpdateProfile = () => {
    let header = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${accessToken}`
    }
    const currentTimestamp = Math.ceil(Date.now() / 1000)
    if (tokenExpiry < currentTimestamp) {
      dispatch(RefreshToken({
        headers: header,
        body: {
          "refreshToken": refreshToken
        }
      })).then((refreshRes) => {
        if (refreshRes.payload?.accessToken) {
          header["Authorization"] = `Bearer ${refreshRes.payload.accessToken}`
          performUpdate(header)
        }
      })
    } else {
      performUpdate(header)
    }
  }

  const performUpdate = (header) => {
    // Build editable fields based on role
    const editableFields = {
      name: userData.name,
      address: userData.address,
      city: userData.city,
      state: userData.state,
      postalCode: userData.postalCode || userData.postal_code,
      mobileNumber: userData.mobileNumber || userData.mobile_number
    };
    
    // Include principal name for school admins (Issue 27)
    if (userRole === "SCHOOL" || userRole === "SCHOOL_ADMIN") {
      editableFields.principalName = userData.principalName || userData.principal_name;
    }
    
    dispatch(UpdateProfile({
      headers: header,
      body: editableFields
    })).then((res) => {
      if (res.payload && res.payload.id) {
        displaySnackbar({ message: "Profile updated successfully!", severity: "success" })
        // Update local state with fresh data from response
        setUserData(prev => ({
          ...prev,
          ...res.payload
        }))
      } else if (res.payload && !res.error) {
        displaySnackbar({ message: "Profile updated successfully!", severity: "success" })
        // Refresh profile data
        let refreshHeader = {
          "Content-Type": "application/json",
          'Accept': 'application/json',
          "Authorization": header["Authorization"]
        }
        dispatch(MyProfile({
          headers: refreshHeader,
          method: "GET",
          body: {}
        })).then((profileRes) => {
          if (profileRes.payload && profileRes.payload.id) {
            setUserData(profileRes.payload)
          }
        })
      } else {
        displaySnackbar({ message: res.payload?.detail || res.payload?.message || "Failed to update profile", severity: "error" })
      }
    }).catch((err) => {
      displaySnackbar({ message: "Failed to update profile", severity: "error" })
    })
  }
  const handlePasswordUpdate = () => {
    let header = {
      "Content-Type": "application/json",
      'Accept': 'application/json',
      "Authorization": `Bearer ${accessToken}`
    }
    let timestamp = Math.ceil(Date.now() / 1000)
    let data = {
      username: userData.email,
      newPassword: newPass,
    }
    if (tokenExpiry < timestamp) {
      dispatch(RefreshToken({
        headers: header,
        body: {
          "refreshToken": refreshToken
        }
      }))
    }
    dispatch(UpdateProfile({
      headers: header,
      body: data
    })).then((res) => {
      // setUserData(res.payload)
    })
  }
  return (
    <div className="profileManinContainer">
      {/* <MobileView>
        <MobileHeader />
      </MobileView> */}
      <div className="homeGutter" style={{ maxWidth: 10 }} />
      <div className="myProfileContainer">
        <div className="profileWrapperContainer">
          <div className="profileHeaderTxtContainer">
            <img alt="" src={blacksetting} />
            <Typography fontSize="15px" fontWeight="bold" className="profileText">
              My Profile{" "}
            </Typography>
          </div>
          <div className="addStudentHeaderBtnContainer">
            <MobileView>
              <Btn />
            </MobileView>
            <BrowserView>
              <Button variant="outlined" className="cancelBtn" onClick={() => navigate(-1)}>
                Cancel
              </Button>
            </BrowserView>
            <Button
              style={{ backgroundColor: "#B3DAFF" }}
              className="saveDataBtn"
              onClick={handleUpdateProfile}
            >
              SaveData
            </Button>
          </div>
        </div>
          {/* Show credits and subscription only for non-super-admin (Issue 17) */}
          {userRole !== 'SUPER_ADMIN' && (userDetails?.credits !== undefined || userData?.credits !== undefined) ? <Card
            elevation={0}
            className="AddFormContainer"
            style={{ minHeight: 85, maxWidth:400, justifyContent:'center', display:'flex', alignItems:"center", gap:20, flexDirection: 'column', padding: '15px' }}
          >
            <div style={{display: 'flex', alignItems: 'center', gap: 20}}>
              <Typography fontWeight="600" fontSize={20}>Available Credits:</Typography>
              <Typography fontSize={28} color={(userDetails?.credits ?? userData?.credits ?? 0) <= 10 ? 'error' : 'primary'}>
                {userDetails?.credits ?? userData?.credits ?? 0}
              </Typography>
            </div>
            {(userDetails?.credits ?? userData?.credits ?? 0) <= 50 && (
              <Button 
                variant="contained" 
                color="primary" 
                onClick={() => navigate('/auth/subscription')}
                style={{backgroundColor: '#5FCBF3'}}
              >
                Get More Credits - Subscribe Now
              </Button>
            )}
            {(userDetails?.subscriptionStatus || userData?.subscription_status) && (
              <Typography fontSize={12} color="textSecondary">
                Subscription: {(userDetails?.subscriptionStatus || userData?.subscription_status || 'free').toUpperCase()}
              </Typography>
            )}
          </Card> : null}
        <div className="profileCardContainer">
          <Card
            elevation={0}
            className="profileStackContainer"
            sx={{ borderRadius: "15px" }}
            style={{ minHeight: "85px" }}
          >
            <Stack direction="row" spacing={2} paddingLeft="15px">
              <Avatar alt="Remy Sharp" src={profileone} />
            </Stack>
            <Link
              color="primary"
              href="/"
              style={{ fontSize: "16px !important", color: "#1F66C4" }}
            >
              Change Photo
            </Link>
          </Card>
        </div>
        <form className="myProfileContainer">
          <Paper
            className="AddFormContainer"
            sx={{ backgroundColor: "white", borderRadius: "15px" }}
          >
            <div className="profileTextfieldContainer">
              <div className="profileTextFieldWrapperContainer">
                <MSTextField id="myProfileUsername" type="text" onChange={handleFieldsChange} value={userData.name} fieldName="name"
                  placeholder={userRole === "SCHOOL" ? "Enter school name" : "Enter full name"} label={userRole === "SCHOOL" ? <><span style={{color: 'red'}}>* </span>School Name</> : <><span style={{color: 'red'}}>* </span>Full Name</>} />
                <MSTextField id="myProfileMobileNumber" type="text" onChange={handleFieldsChange} value={userData.mobileNumber || userData.mobile_number} fieldName="mobileNumber"
                  placeholder="Enter mobile number" label={<><span style={{color: 'red'}}>* </span>Mobile Number</>} />
                <MSTextField id="myProfileEmailId" type="text" value={userData.email} fieldName="email"
                  label={<><span style={{color: 'red'}}>* </span>Email ID</>} disabled={true} />
                {userRole === "STUDENT" ?
                  <MSTextField id="myProfileParent" type="text" value={userData.fatherName || userData.father_name}
                    label="Parent Name" disabled={true} />
                  : null}
              </div>
              
              {/* Codes Section - visible based on role */}
              <div className="profileTextFieldWrapperContainer">
                {/* Student: show student code, teacher code, school code */}
                {userRole === "STUDENT" && (
                  <>
                    <MSTextField id="myProfileStudentCode" type="text" value={userData.studentCode || userData.student_code}
                      label="Student Code" disabled={true} />
                    <MSTextField id="myProfileTeacherCode" type="text" value={userData.teacherCode || userData.teacher_code}
                      label="Teacher Code" disabled={true} />
                    <MSTextField id="myProfileTeacherName" type="text" value={userData.teacherName || userData.teacher_name}
                      label="Teacher Name" disabled={true} />
                    <MSTextField id="myProfileSchoolCode" type="text" value={userData.schoolCode || userData.school_code}
                      label="School Code" disabled={true} />
                    <MSTextField id="myProfileSchoolName" type="text" value={userData.schoolName || userData.school_name}
                      label="School Name" disabled={true} />
                    <MSTextField id="myProfileClass" type="text" value={userData.className || userData.class_name}
                      label="Class" disabled={true} />
                    <MSTextField id="myProfileSection" type="text" value={userData.sectionName || userData.section_name}
                      label="Section" disabled={true} />
                    <MSTextField id="myProfileRollNumber" type="text" value={userData.rollNumber || userData.roll_number}
                      label="Roll Number" disabled={true} />
                  </>
                )}
                
                {/* Teacher: show teacher code, school code */}
                {userRole === "TEACHER" && (
                  <>
                    <MSTextField id="myProfileTeacherCode" type="text" value={userData.teacherCode || userData.teacher_code}
                      label="Teacher Code" disabled={true} />
                    <MSTextField id="myProfileSchoolCode" type="text" value={userData.schoolCode || userData.school_code}
                      label="School Code" disabled={true} />
                    <MSTextField id="myProfileSchoolName" type="text" value={userData.schoolName || userData.school_name}
                      label="School Name" disabled={true} />
                  </>
                )}
                
                {/* School Admin: show school code */}
                {(userRole === "SCHOOL" || userRole === "SCHOOL_ADMIN") && (
                  <>
                    <MSTextField id="myProfileSchoolCode" type="text" value={userData.schoolCode || userData.school_code}
                      label="School Code" disabled={true} />
                    <MSTextField id="myProfilePrincipalName" type="text" value={userData.principalName || userData.principal_name} onChange={handleFieldsChange} fieldName="principalName"
                      label="Principal Name" />
                  </>
                )}
              </div>
              
              <div className="profileTextFieldWrapperContainer">
                <MSTextField id="myProfileAddress" type="text" onChange={handleFieldsChange} value={userData.address} fieldName="address"
                  placeholder="Enter complete address here" label="Address" />
                <MSTextField id="myProfileCity" type="text" onChange={handleFieldsChange} value={userData.city} fieldName="city"
                  placeholder="Enter city name" label="City" />
                <MSTextField id="myProfileState" type="text" onChange={handleFieldsChange} value={userData.state} fieldName="state"
                  placeholder="Enter state" label="State" />
                <MSTextField id="myProfilePincode" type="text" onChange={handleFieldsChange} value={userData.postalCode || userData.postal_code} fieldName="postalCode" 
                  placeholder="Enter postal code" label={<><span style={{color: 'red'}}>* </span>Postal Code</>} />
              </div>
            </div>
          </Paper>
          <br />
          {/* <Paper elevation={0} sx={{ borderRadius: "15px" }}>
            <div className="profilechangePasswordLinkContainer">
              <div className="profileLinkContainer">
                <MSTextField id="myProfilePassword" type="password" placeholder="Enter new password" label="*New Password" onChange={(e) => setNewPass(e.target.value)} />
                <MSTextField id="myProfileConfirmPassword" type="password" placeholder="Enter new confirm password" label="*Confirm Password" />
                <div className="profilePwd" style={{ display: 'flex', paddingTop: '2%' }}>
                  <Button
                    style={{ backgroundColor: "#B3DAFF", minWidth: 'unset', maxWidth: 'unset' }}
                    className="saveDataBtn"
                    onClick={handlePasswordUpdate}
                  >
                    Change Password
                  </Button>
                </div>
              </div>
            </div>
          </Paper> */}
        </form>
      </div>
      <div className="homeGutter" style={{ maxWidth: 10 }} />
    </div>
  );
};
export default Profile;
