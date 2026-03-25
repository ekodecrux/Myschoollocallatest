import React, { useState, useEffect } from "react";
import { Button, Card, InputAdornment, Typography, Checkbox, FormControlLabel } from "@mui/material";
import "./Login.css";
import MSTextField from "../../../customTheme/textField/MSTextField";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import EyeImage from "../../../assests/signupScreen/OpenEye.svg";
import { userLogin, UpdatePassword, sendOtpThunk, userOtpLogin, forgotPwd, newPwdLogin } from "../../../redux/authSlice";
import { useSnackbar } from "../../../hook/useSnackbar";
import { isMobile } from "react-device-detect";
import { ReactComponent as Crossicon } from "../../../assests/homeScreen/crossicon.svg";
import WestRoundedIcon from '@mui/icons-material/WestRounded';
import { ReactComponent as MySchool } from "../../../assests/homeScreenLogo.svg";
export const Login = React.forwardRef((props, ref) => {
  const { refreshToken, accessToken } = useSelector((state) => state.login);
  const [authChallenge, setAuthChallenge] = useState(false);
  // Constants for OTP login
  const [loginType, setLoginType] = useState(null)
  const [phoneNumber, setPhoneNumber] = useState(null)
  const [otpSent, setOtpSent] = useState(null)
  const [forgetPass, setForgetPass] = useState(false)
  const [codeSent, setCodeSent] = useState(false)
  const [code, setCode] = useState('');
  const { displaySnackbar } = useSnackbar();
  const [user, setUser] = useState("");
  const [pwd, setPwd] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  var path = location.pathname
  
  // Load remembered credentials on component mount
  useEffect(() => {
    const savedEmail = localStorage.getItem('myschool_remembered_email');
    const savedRemember = localStorage.getItem('myschool_remember_me') === 'true';
    if (savedRemember && savedEmail) {
      setUser(savedEmail);
      setRememberMe(true);
    }
  }, []);
  
  const userLogIn = (e) => {
    e.preventDefault();
    
    // Handle Remember Me
    if (rememberMe) {
      localStorage.setItem('myschool_remembered_email', user);
      localStorage.setItem('myschool_remember_me', 'true');
    } else {
      localStorage.removeItem('myschool_remembered_email');
      localStorage.removeItem('myschool_remember_me');
    }
    
    let header = {
      "Content-Type": "application/json",
    };
    dispatch(
      userLogin({
        header: header,
        method: "POST",
        body: { username: user, password: pwd },
      })
    ).then((res) => {
      if (res.payload.accessToken) {
        // const message = res.payload.message.split('.')[0];
        const message = "You are logged in successfully"
        displaySnackbar({ message: message });
        props.handleCloseModal()
      } else if (res.payload.data?.challengeName === "NEW_PASSWORD_REQUIRED") {
        // Handle password change challenge
        setAuthChallenge(res.payload.data);
        displaySnackbar({ message: "Please set a new password" });
      } else if (res.payload.message === "Password change required") {
        // Alternative check for password change
        setAuthChallenge(res.payload.data);
        displaySnackbar({ message: "Please set a new password" });
      } else if (res.payload.message) {
        const message = res.payload.message.split('.')[0];
        displaySnackbar({ message: message });
      } else if (res.payload.error) {
        const err = res.payload.error.split('.')[0];
        displaySnackbar({ message: err });
      } else if (res.payload.detail) {
        displaySnackbar({ message: res.payload.detail });
      } else {
        displaySnackbar({ message: 'Login failed. Please try again.' });
      }
    });
  };
  const handleLoginNav = (e) => {
    props.changeTab();
  };
  // useEffect(() => {
  //   if (accessToken && refreshToken && path === "/") {
  //     navigate("/auth");
  //   }
  // }, [accessToken, refreshToken]);
  const handleAuthChallenge = () => {
    if (newPass !== confirmPass) {
      displaySnackbar({
        message: "Password does not match with Confirm Password.",
      });
    } else {
      let headers = {
        "Content-Type": "application/json",
      };
      dispatch(
        UpdatePassword({
          headers: headers,
          method: "POST",
          body: {
            username: user,
            session: authChallenge.session,
            newPassword: newPass,
          },
        })
      ).then((res) => {
        if (res.payload?.accessToken) {
          displaySnackbar({ message: "Password updated successfully. You are now logged in." });
          setAuthChallenge(null);
          setNewPass('');
          setConfirmPass('');
          props.handleCloseModal();
        } else if (res.payload?.message) {
          displaySnackbar({ message: res.payload.message });
        } else if (res.payload?.detail) {
          displaySnackbar({ message: res.payload.detail });
        } else if (res.payload?.error) {
          displaySnackbar({ message: res.payload.error });
        }
      });
    }
  };
  const handleOtpSend = () => {
    if (phoneNumber) {
      dispatch(
        sendOtpThunk({
          "phoneNumber": phoneNumber.replace('+', "%2B")
        })
      ).then((res) => {
        let data = res.payload
        if (data.message === "success") {
          delete data.message
          displaySnackbar({ message: "OTP Sent Successfully." });
          setOtpSent(data)
        } else {
          displaySnackbar({ message: data.message });
        }
      })
    } else {
      displaySnackbar({ message: "Please Enter a valid mobile number." });
    }
  }
  const handleForgotPwd = () => {
    setForgetPass(true)
    setOtpSent(null)
    // Forgot password flow
  }
  const handleCodeSent = () => {
    // User auth
    // setCodeSent(true)
    if (user) {
      dispatch(
        forgotPwd({
          "user": user
        })
      ).then((res) => {
        let data = res.payload
        if (data.message === "Success") {
          delete data.message
          displaySnackbar({ message: `Code sent successfully to ${user}` });
          setCode(data)
        }
        else if (res.payload.message) {
          let msg = res.payload.message.split('.')[0]
          displaySnackbar({ message: msg })
        }
      })
    }
    setCodeSent(true)
  }
  const handleNewPwdLogin = () => {
    // Password reset
    if (codeSent && code) {
      let header = {
        "Content-Type": "application/json",
      };
      dispatch(
        newPwdLogin({
          header: header,
          body: {
            email: user,
            newPassword: newPass,
            code: code
          }
        })
      ).then((res) => {
        if (res.payload && res.payload.message === "Password reset successfully") {
          displaySnackbar({ message: "Password reset successfully! Please login with your new password." });
          // Reset the form and go back to login
          setForgetPass(false);
          setCodeSent(false);
          setCode('');
          setNewPass('');
          setPwd('');
          setUser('');
        } else if (res.payload && res.payload.detail) {
          displaySnackbar({ message: res.payload.detail })
        } else if (res.payload && res.payload.error) {
          displaySnackbar({ message: res.payload.error })
        } else if (res.payload && res.payload.message) {
          displaySnackbar({ message: res.payload.message.split('.')[0] });
        }
      })
    } else {
      displaySnackbar({ message: "Please enter the code from your email." });
    }
  }
  const handleNavigate = () => {
    setOtpSent(null)
    setLoginType(null)
    setForgetPass(false)
    setCodeSent(null)
    setCode('')
    setNewPass("")
  }
  const handleOtpLogin = () => {
    if (otpSent.otp) {
      let header = {
        "Content-Type": "application/json",
      };
      dispatch(
        userOtpLogin({
          header: header,
          method: "POST",
          body: otpSent,
        })
      ).then((res) => {
        if (res.payload.message) {
          displaySnackbar({ message: res.payload.message });
        } else {
          if (res.payload.accessToken) {
            displaySnackbar({ message: "Logged In successfully" });
            props.handleCloseModal()
          }
        }
      })
    } else {
      displaySnackbar({ message: "Wrong OTP." });
    }
  }
  return (
    <div className="loginParentCard" style={{
      flexDirection: isMobile ? 'column' : 'row',
      alignItems: isMobile ? 'center' : 'flex-start', minWidth: isMobile ? '100vw' : 'unset'
    }}>
      <Card style={{ display: 'flex', flex: 1, flexDirection: 'column', minWidth: isMobile ? '100vw' : 'unset', position: 'relative' }}>
        {/* Close button inside the card - positioned outside the logo area */}
        <div style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          display: 'flex',
          backgroundColor: '#f5f5f5',
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 100,
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <Crossicon
            onClick={() => props.handleCloseModal()}
            style={{ width: '14px', height: '14px' }}
          />
        </div>
        <div className="loginNav">
          {isMobile ? null : (
            <div className="loginNewLogoContainer">
              <MySchool className="loginMySchoolLogo" />
            </div>
          )}
          <div className={isMobile ? "" : "loginBtnContainer"}>
            <Button
              variant="contained"
              color="secondary"
              className="loginTabBtn"
            >
              Sign In
            </Button>
            <Button variant="text" onClick={handleLoginNav} tabIndex={1}>
              Register
            </Button>
          </div>
        </div>
        {authChallenge ? (
          <form className="loginForm">
            <div className="loginHeading">
              <h3>New Password is required before log in.</h3>
            </div>
            <div className="loginTextFieldContainer">
              <MSTextField
                id="signUpUserPass"
                type="password"
                onChange={(e) => setNewPass(e.target.value)}
                placeholder="Enter your password"
                label="* New Password"
              />
              <MSTextField
                id="signUpRePass"
                type="password"
                onChange={(e) => setConfirmPass(e.target.value)}
                placeholder="Renter your password"
                label="* Confirm Password"
              />
            </div>
            <div className="loginContBtn">
              <Button
                variant="contained"
                color="secondary"
                fullWidth
                onClick={handleAuthChallenge}
              >
                Continue
              </Button>
            </div>
          </form>
        ) : (
          <form className="loginForm" onSubmit={(e) => {
            e.preventDefault();
            if (loginType === 'email' && !forgetPass) {
              userLogIn(e);
            } else if (loginType === 'email' && forgetPass && codeSent) {
              handleNewPwdLogin();
            } else if (loginType === 'phone' && otpSent) {
              handleOtpLogin();
            }
          }}>
            <div className="loginHeading">
              {loginType ? <div
                onClick={handleNavigate}
                style={{ position: 'absolute', left: 0 }}>
                <WestRoundedIcon />
              </div> : null}
              <h3>{forgetPass ? 'Enter your registered email to receive code' : 'Sign In To Your Account'}</h3>
            </div>
            {loginType ? <>
              {loginType === 'email' && forgetPass === false ?
                <div className="loginTextFieldContainer">
                  <MSTextField
                    id="loginUsername"
                    label="*E-mail Id"
                    type="text"
                    placeholder="Enter e-Mail Id"
                    value={user}
                    onChange={(e) => setUser(e.target.value)}
                    required
                    style={{ width: "100%" }}
                  />
                  <MSTextField
                    id="loginPassword"
                    label="* Password"
                    type="password"
                    fieldName="password"
                    placeholder="Enter your password"
                    onChange={(e) => setPwd(e.target.value)}
                    required
                    style={{ width: "100%" }}
                  />
                  <div className="loginRememberContainer">
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <Checkbox 
                        checked={rememberMe} 
                        onChange={(e) => setRememberMe(e.target.checked)}
                        size="small"
                        sx={{ padding: '4px' }}
                      />
                      <Typography fontSize="13px">Remember Me</Typography>
                    </div>
                    <div className="forgotPassword">
                      <Button variant="text" onClick={handleForgotPwd}>
                        <Typography className="forgotPassword">
                          Forgot Password?
                        </Typography>
                      </Button>
                    </div>
                  </div>
                </div>
                : <div className="loginTextFieldContainer" style={{ display: forgetPass ? 'none' : 'flex' }}>
                  <MSTextField
                    label="* Phone number"
                    type="tel"
                    placeholder="+91 99999 99999"
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    required
                    style={{ width: "100%" }}
                  />
                  {!otpSent && loginType !== 'email' ? null : <MSTextField
                    label="* OTP"
                    type="number"
                    placeholder="Enter the OTP received on your mobile number"
                    onChange={(e) => {
                      let data = { ...otpSent }
                      data.otp = e.target.value
                      setOtpSent(data)
                    }}
                    required
                    style={{ width: "100%" }}
                  />}
                </div>}
              {loginType === "email" && forgetPass === true ?
                <>
                  <div className="loginTextFieldContainer">
                    <MSTextField
                      id="loginUsername"
                      label="*E-mail Id"
                      type="text"
                      placeholder="Enter e-Mail Id"
                      onChange={(e) => setUser(e.target.value)}
                      required
                      style={{ width: "100%" }}
                    />
                  </div>
                  {codeSent ?
                    <>
                      <MSTextField
                        id="loginNewPwd"
                        label="New Password"
                        type="password"
                        fieldName="password"
                        placeholder="Enter your new password"
                        onChange={(e) => setNewPass(e.target.value)}
                        required
                        style={{ width: "100%" }}
                      />
                      <MSTextField
                        id="loginCode"
                        label="Code"
                        type="text"
                        placeholder="Enter code you received on email"
                        onChange={(e) => {
                          // let data = { ...codeSent }
                          let data = e.target.value
                          setCode(data)
                        }}
                        required
                        style={{ width: "100%" }}
                      />
                    </> : null}
                  <div className="loginContBtn">
                    <Button
                      variant="contained"
                      color="secondary"
                      fullWidth
                      onClick={codeSent ? handleNewPwdLogin : handleCodeSent}
                    >
                      Continue
                    </Button>
                  </div>
                </>
                : null}
              {!otpSent && loginType !== 'email' ? null :
                <div className="loginResendOtpContainer" style={{ display: loginType !== "email" ? 'flex' : 'none' }}>
                  <div className="loginResendOtp">
                    <Button variant="text" onClick={handleOtpSend}>
                      <Typography className="loginResendOtp">
                        Resend OTP
                      </Typography>
                    </Button>
                  </div>
                </div>}
              <div className="loginContBtn" style={{ display: forgetPass ? 'none' : 'flex' }}>
                <Button
                  type="submit"
                  variant="contained"
                  color="secondary"
                  fullWidth
                  onClick={!otpSent && loginType !== 'email' ? handleOtpSend : loginType === 'email' ? userLogIn : handleOtpLogin}
                >
                  {!otpSent && loginType !== 'email' ? "Send OTP" : "Continue"}
                </Button>
              </div>
            </> :
              <div className="loginChoice">
                <Button
                  variant="contained"
                  color="secondary"
                  fullWidth
                  onClick={() => setLoginType('email')}
                >
                  Sign in using your Email ID
                </Button>
                <Typography>Or</Typography>
                <Button
                  variant="contained"
                  color="secondary"
                  fullWidth
                  onClick={() => setLoginType('phone')}
                >
                  Sign in using your Phone No.
                </Button>
              </div>}
          </form>
        )}
      </Card>
    </div>
  );
});
