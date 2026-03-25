import { Breadcrumbs, Card } from '@mui/material';
import React, { useState } from 'react';
import DynamicBreadcrumb from '../../../../customTheme/breadcrumbs/breadcrumbs';
import hamburgerIcon from "../../../../assests/header/hamburger.svg";
import './MobileNavbar.css';
import {
  Avatar,
  IconButton,
  Menu,
  MenuItem,
} from "@mui/material";
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import AvatarIcon from "../../../../assests/header/avatar.svg";
import AvatarBlackIcon from "../../../../assests/auth/AvatarBlack.svg";
import { logoutUser } from "../../../../redux/authSlice";
const MobileNavbar = (props) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const { appType } = useSelector((state) => state.login);
  const open = Boolean(anchorEl);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };
  const userLogout = () => {
    dispatch(logoutUser());
    navigate("/");
  };
  const userProfile = () => {
    navigate("/auth");
    setAnchorEl(null);
  }
  return (
    <div className='mobileHeader' >
      <Card className='mobileViewMainContainer' style={{ maxWidth: '540px', minHeight: '42px', marginTop: '54px' }}>
        <section className='mobileBreadCrumb'>
          <Breadcrumbs aria-label="breadcrumb" className="mobileViewBreadcrumb">
            {/* <Link
          underline="hover"
          color="inherit"
          href="/material-ui/getting-started/installation/"
        >
          Core
        </Link> */}
            <DynamicBreadcrumb color="white" />
            {/* <Typography color="text.primary">Breadcrumbs</Typography> */}
          </Breadcrumbs>
        </section>
        <section className='stackContainer'>
          {/* <img src={profileone}/> */}
          <div className="navWrapper">
            <div className="mobileViewProfileLogo" style={{ paddingTop: "7px" }}>
              <IconButton
                id="avatarBtn"
                aria-controls={open ? "basic-menu" : undefined}
                aria-haspopup="true"
                aria-expanded={open ? "true" : undefined}
                onClick={handleClick}
              >
                <Avatar src={open ? AvatarBlackIcon : AvatarIcon} />
              </IconButton>
              <Menu
                id="basic-menu"
                anchorEl={anchorEl}
                transformOrigin={{ horizontal: "right", vertical: "top" }}
                anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
                open={open}
                sx={{
                  ".MuiMenu-paper": {
                    minWidth: 213,
                    background:
                      "transparent linear-gradient(180deg, #000000CC 0%, #3D3D3D99 100%) 0% 0% no-repeat padding-box",
                    color: "white",
                  },
                }}
                onClose={handleClose}
                MenuListProps={{
                  "aria-labelledby": "avatarBtn",
                }}
              >
                <MenuItem className="linkTypoProxima" onClick={() => { navigate('/auth'); handleClose(); }}>
                  Dashboard
                </MenuItem>
                <MenuItem className="linkTypoProxima" onClick={userProfile}>
                  Profile
                </MenuItem>
                <MenuItem className="linkTypoProxima" onClick={appType === "MobileApp" ? 
                  () => window.flutter_inappwebview.callHandler('closeWebView', '*') : userLogout}>
                  {appType === "MobileApp" ? "Back to App" : "Logout" }
                </MenuItem>
              </Menu>
            </div>
          </div>
          <div onClick={props.toggleDrawer} className="mobileViewHamburgerIcon">
            <img src={hamburgerIcon} alt="hamburgerImage" />
          </div>
        </section>
        {/* <div onClick={props.toggleDrawer}>
          <img src={hamburgerIcon} />
        </div> */}
      </Card>
    </div>
  )
}
export default MobileNavbar;