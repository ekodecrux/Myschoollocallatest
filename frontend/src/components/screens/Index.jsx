import React, { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import AdsComponent from "../adsComponent/adsComponent";
import Header from "../header/Header";
import "./screenInitializer.css";
import { useLocation } from "react-router-dom";
import Footer from "../auth/views/footer/Footer";
import OTPInput from "otp-input-react";
import { Avatar, Button, Modal, Typography } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { protectted } from "../../redux/protectSlice";
import { Stack } from "@mui/system";
import { deepPurple } from "@mui/material/colors";
import { ReactComponent as Crossicon } from "../../assests/homeScreen/crossicon.svg";
import { useSnackbar } from "../../hook/useSnackbar";
// const devTools = require('browser-detect-devtools');
// const devToolsManager = devTools.Manager;
const ScreenInitializer = () => {
  const headerRef = React.useRef(null);
  const location = useLocation();
  const [isOpened, setIsOpened] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const [open, setOpen] = React.useState(true);
  const [OTP, setOTP] = useState();
  const { protectedCode, isProtected } = useSelector((state) => state.protecttedUser);
  const dispatch = useDispatch();
  const { displaySnackbar } = useSnackbar();
  let path = location.pathname;
  const handleClose = () => {
    if (protectedCode == OTP) {
      setOpen(false);
    }
    else {
      displaySnackbar({ message: 'Please Enter The PassCode' });
    }
  };
  const checkUser = () => {
    if (protectedCode == OTP) {
      setOpen(false);
      dispatch(protectted());
      return
    } else {
      displaySnackbar({ message: 'Please Enter The Write PassCode' });
    }
  };
  // React.useEffect(() => {
  //     devToolsManager.alwaysConsoleClear(false);
  //     // devToolsManager.freezeWhenDevToolsOpened(true);
  //     devToolsManager.startDevToolMonitoring((isOpened, orientation) => {
  //       // orientation : 'horizontal' / 'vertical' / 'separated-window'
  //       alert(`${isOpened}, ${orientation}`)
  //       setIsOpened(isOpened)
  //     });
  //   }, [])
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])
  if (isOpened) {
    return <Navigate to={"/unauthorized"} />;
  } else {
    return (
      <div className="screenInitializerContainer">
        <Header ref={headerRef} />
        {isProtected && path !== '/views/privacy' ?
          <Modal open={open}>
            <div
              style={{
                width: "500px",
                height: "400px",
                backgroundColor: "whitesmoke",
                display: "flex",
                flexDirection: "column",
                gap: "40px",
                borderRadius: "20px",
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                <Crossicon onClick={handleClose} />
              </div>
              <div style={{ display: 'flex', flex: '1', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '40px' }}>
                {/* <Stack direction="row" spacing={2}>
                <Avatar sx={{ bgcolor: deepPurple[500] }}>HP</Avatar>
              </Stack> */}
                <Typography variant="h1" fontSize={"25px"}>
                  Verify It Is You
                </Typography>
                <Typography>Validate This Device By Entering The OTP</Typography>
                <OTPInput
                  value={OTP}
                  onChange={setOTP}
                  autoFocus
                  OTPLength={3}
                  otpType="number"
                  disabled={false}
                  secure
                />
                <div>
                  <Button variant="contained" color="success" className="protedtedButton" fullwidth onClick={checkUser}>
                    Continue
                  </Button>
                </div>
              </div>
            </div>
          </Modal>
          : null}
        <div className="screenInitializerWrapper">
          {!location.search && location.pathname !== "/views/privacy" ? (
            <AdsComponent />
          ) : null}
          <Outlet ref={headerRef} />
        </div>
        <Footer />
      </div>
    );
  }
};
export default ScreenInitializer;
