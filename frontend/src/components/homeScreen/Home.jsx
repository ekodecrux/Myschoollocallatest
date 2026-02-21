import React, { useState } from "react";
import "./Home.css";
import {
  Button,
  InputAdornment,
  Modal,
  TextField,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
} from "@mui/material";
import ClearIcon from "@mui/icons-material/Clear";
import { ReactComponent as MySchool } from "../../assests/homeScreen/myschool-black-logo.svg";
import Microphone from "../../assests/homeScreen/Microphone.svg";
import AvatarIcon from "../../assests/header/avatar.svg";
import AvatarBlackIcon from "../../assests/auth/AvatarBlack.svg";
import { Login } from "../auth/login/Login";
import EnhancedSearch from "../search/EnhancedSearch";
import Lottie from "react-lottie";
import { navData, lottieOptions } from "./Constants.jsx";
import { SignUp } from "../auth/signUp/SignUp";
import { logoutUser } from "../../redux/authSlice";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { Suspense } from 'react';
import { CircularProgress, Box } from '@mui/material';
const HomeCategory = React.lazy(() => import('./HomeCategory'));
const GovImageRender = React.lazy(() => import('./GovImageRender'));
const ServiceImageRender = React.lazy(() => import('./ServiceImageRender'));

// Centered loading spinner for lazy components
const CenteredLoader = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', py: 4 }}>
    <CircularProgress size={40} sx={{ color: '#1976d2' }} />
  </Box>
);
export default function Home() {
  const { isLoggedin } = useSelector((state) => state.login);
  const [open, setOpen] = React.useState(false);
  const [tab, setTab] = React.useState(0);
  const [anchorEl, setAnchorEl] = useState(null);
  const [searchText, setSearchText] = useState("");
  const opened = Boolean(anchorEl);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const handleIconClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleProfileClose = () => {
    setAnchorEl(null);
  };
  const userLogout = (e) => {
    dispatch(logoutUser());
    navigate("/");
  };
  const handleOpen = () => {
    if (isLoggedin) {
      userLogout();
    } else {
      setOpen(true);
      setTab(0);
    }
  };
  const handleClose = () => {
    setOpen(false);
    setTab(0);
  };
  // Function to return Home navigational bar
  // @param none
  const navRender = () => {
    return (
      <div className="homeNavigation">
        {navData.map((key, index) => {
          return (
            <Link
              to={key.url}
              key={`nav-${index}`}
              className="homeNavigationLink"
            >
              <img
                alt={key.name.toLocaleLowerCase().replace(" ", "")}
                src={key.image}
                style={{ width: "90px" }}
              />
              <p>{key.name}</p>
            </Link>
          );
        })}
      </div>
    );
  };
  // Functions handle redirection to search page on enter press
  // @params [keycode]
  // navigate to result page send search text in url encoded format
  const handleEnterKey = (e) => {
    if (e.keyCode === 13) {
      navigate({ pathname: "/views/result", search: `?text=${searchText}` });
    }
  };
  // Function save search text field text in variable
  // @params [event] 
  const handleSearchText = (e) => {
    setSearchText(e.target.value);
  }
  // Function to clear search text
  const handleClearSearch = () => {
    setSearchText("");
  }
  return (
    <>
      <div className="homeContainer">
        <div className="homeHeader">
          <div className="homeGutter"></div>
          <div className="homeHeaderBtnContainer">
            <Button variant="text" className="buttonDownloadApp" onClick={() => window.open('https://play.google.com/store/apps/details?id=com.myschool.app', '_blank')}>
              Download App
            </Button>
            {!isLoggedin && (
              <Button
                variant="text"
                className="buttonSignIn"
                onClick={handleOpen}
              >
                Sign In
              </Button>
            )}
          </div>
          {isLoggedin ? (
            <div className="navWrapper avatarPosition" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {/* Dashboard Button - visible on main screen */}
              <Button
                variant="text"
                onClick={() => navigate('/auth')}
                sx={{
                  color: '#494949',
                  textTransform: 'none',
                  fontWeight: 500,
                  '&:hover': { backgroundColor: 'rgba(0,0,0,0.05)' }
                }}
              >
                Dashboard
              </Button>
              {/* Signout Button - beside profile icon */}
              <Button
                variant="outlined"
                size="small"
                onClick={userLogout}
                sx={{
                  color: '#d32f2f',
                  borderColor: '#d32f2f',
                  textTransform: 'none',
                  fontSize: '0.85rem',
                  '&:hover': { 
                    backgroundColor: 'rgba(211, 47, 47, 0.04)',
                    borderColor: '#d32f2f'
                  }
                }}
              >
                Sign Out
              </Button>
              {/* Profile Icon */}
              <div className="profileLogo">
                <IconButton
                  id="avatarBtn"
                  aria-controls={opened ? "basic-menu" : undefined}
                  aria-haspopup="true"
                  aria-expanded={opened ? "true" : undefined}
                  onClick={handleIconClick}
                >
                  <Avatar src={opened ? AvatarBlackIcon : AvatarIcon} />
                </IconButton>
                <Menu
                  id="basic-menu"
                  anchorEl={anchorEl}
                  transformOrigin={{ horizontal: "right", vertical: "top" }}
                  anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
                  open={opened}
                  sx={{
                    ".MuiMenu-paper": {
                      minWidth: 213,
                      background:
                        "transparent linear-gradient(180deg, #000000CC 0%, #3D3D3D99 100%) 0% 0% no-repeat padding-box",
                      color: "white",
                    },
                  }}
                  onClose={handleProfileClose}
                  MenuListProps={{
                    "aria-labelledby": "avatarBtn",
                  }}
                >
                  <MenuItem
                    className="linkTypoProxima"
                    onClick={() => navigate('/auth')}
                  >
                    Dashboard
                  </MenuItem>
                </Menu>
              </div>
            </div>
          ) : (
            ""
          )}
          <div className="homeGutter indiaFlag"></div>
        </div>
        <div className="homeContextArea">
          <div className="homeGutter"></div>
          <div className="homeCtxAreaWrapper">
            <div className="homeLogo">
              <MySchool className="myschoolHomeLogo" />
            </div>
            <div className="homeSearch">
              <EnhancedSearch variant="home" />
            </div>
            {/* Render Navigation */}
            {navRender()}
          </div>
          <div className="homeGutter"></div>
        </div>
        <Suspense fallback={<CenteredLoader />}>
          <HomeCategory />
        </Suspense>
        <Suspense fallback={<CenteredLoader />}>
          <GovImageRender />
        </Suspense>
        <Suspense fallback={<CenteredLoader />}>
          <ServiceImageRender />
        </Suspense>
        <div className="homeFooter">
          <div className="homeGutter"></div>
          <div className="homeFooterContainer">
            <Link to={'/views/privacy'}><Typography>Privacy</Typography></Link>
            <Link to={'/views/terms'}><Typography>Terms</Typography></Link>
            <Link to={'/views/cookies'}><Typography>Cookies</Typography></Link>
            <Link to={'/views/help'}><Typography>Help</Typography></Link>
          </div>
          <div className="homeGutter"></div>
        </div>
      </div>
      {/* Render Modal for the Auth Section */}
      <Modal className="openModal" onClose={handleClose} open={open}>
        {tab === 0 ? (
          <Login changeTab={() => setTab(tab === 0 ? 1 : 0)} handleCloseModal={handleClose} />
        ) : (
          <SignUp changeTab={() => setTab(tab === 0 ? 1 : 0)} handleCloseModal={handleClose} />
        )}
      </Modal>
    </>
  );
}
