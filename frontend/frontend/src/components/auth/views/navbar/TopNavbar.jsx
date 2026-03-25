import React, { useState, useEffect } from "react";
import "./TopNavbarStyle.css";
import { ReactComponent as MySchool } from "../../../../assests/logo.svg";
import {
  Link,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  Typography,
  Divider,
  Button,
  Box,
  Chip,
} from "@mui/material";
import hamburgerIcon from "../../../../assests/header/hamburger.svg";
import AvatarIcon from "../../../../assests/header/avatar.svg";
import AvatarBlackIcon from "../../../../assests/auth/AvatarBlack.svg";
import { logoutUser } from "../../../../redux/authSlice";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { isMobile } from "react-device-detect";
import home from "../../../../assests/homeScreen/home.svg";
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import jwt_decode from "jwt-decode";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const TopNavbar = (props) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [anchorEl2, setAnchorEl2] = useState(null);
  const [webView, setWebView] = useState(window.self !== window.top)
  const [notifications, setNotifications] = useState(JSON.parse(localStorage.getItem('mySchoolNotification')))
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState("");
  const [credits, setCredits] = useState(null);
  const [isUnlimited, setIsUnlimited] = useState(false);
  const [creditWarning, setCreditWarning] = useState(null);
  const { appType, accessToken } = useSelector((state) => state.login);
  const { userDetails } = useSelector((state) => state.myProfile);
  const open = Boolean(anchorEl);
  const notificationOpen = Boolean(anchorEl2)
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Get user info from JWT token and userDetails
  useEffect(() => {
    if (accessToken) {
      try {
        const decoded = jwt_decode(accessToken);
        const role = decoded['cognito:groups']?.[0] || '';
        setUserRole(role);
        // Format role for display (e.g., SCHOOL_ADMIN -> School Admin)
      } catch (e) {
        console.log("Error decoding token:", e);
      }
    }
  }, [accessToken]);

  // Fetch credits with auto-refresh - Issue 20
  useEffect(() => {
    const fetchCredits = async () => {
      if (!accessToken) return;
      try {
        const response = await axios.get(`${BACKEND_URL}/api/rest/users/checkCredits`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (response.data.isUnlimited) {
          setIsUnlimited(true);
          setCredits(null);
        } else {
          setCredits(response.data.credits);
          setIsUnlimited(false);
          if (response.data.warningLevel) {
            setCreditWarning({
              level: response.data.warningLevel,
              message: response.data.message
            });
          }
        }
      } catch (e) {
        console.log("Error fetching credits:", e);
      }
    };
    
    // Initial fetch
    fetchCredits();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchCredits, 30000);
    
    // Listen for credit update events
    const handleCreditUpdate = () => fetchCredits();
    window.addEventListener('creditsUpdated', handleCreditUpdate);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('creditsUpdated', handleCreditUpdate);
    };
  }, [accessToken]);

  useEffect(() => {
    if (userDetails?.name) {
      setUserName(userDetails.name);
    }
  }, [userDetails]);

  // Format role for display
  const formatRole = (role) => {
    if (!role) return '';
    return role.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };

  const handleClick = (event, flag) => {
    if (flag) {
      setNotifications(JSON.parse(localStorage.getItem('mySchoolNotification')))
      setAnchorEl2(event.currentTarget);
      return
    }
    setAnchorEl(event.currentTarget);
  };
  const handleClose = (e, flag) => {
    if (flag) {
      setAnchorEl2(null);
      return
    }
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
  const RenderNotification = () => {
    return (
      <Menu
        id="basic-menu-notification"
        anchorEl={anchorEl2}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        open={notificationOpen}
        sx={{
          ".MuiMenu-paper": {
            minWidth: 213,
            marginTop: 2,
            // background:
            //   "transparent linear-gradient(180deg, #000000CC 0%, #3D3D3D99 100%) 0% 0% no-repeat padding-box",
            // color: "white",
          },
          ".MuiMenu-list" : {
            display: 'flex',
            flexDirection :'column'
          }
        }}
        onClose={(e) => handleClose(e, true)}
        MenuListProps={{
          "aria-labelledby": "avatarBtn",
        }}
      >
        {notifications ? notifications.map((k,i) => 
          <MenuItem className="linkTypoProxima" style={{display:'flex', flexDirection:'column', alignItems:'flex-start'}}>
            <Typography fontSize={16}>{k.notification.title}</Typography>
            <Typography fontSize={12}>{k.notification.body}</Typography>
          </MenuItem>
        ) : <MenuItem className="linkTypoProxima" style={{display:'flex', flexDirection:'column', alignItems:'flex-start'}}>
            <Typography>No Notifications.</Typography>
          </MenuItem>
        }
        <Divider />
        {notifications ? <Button color="primary" size="small" 
          onClick={handleClearNotifications}
          variant="text" style={{alignSelf:'end'}} > 
          <Typography color='#8fb4ff'>Clear All</Typography> 
        </Button> : null }
      </Menu>
    )
  }
  const handleClearNotifications = () => {
    localStorage.setItem("mySchoolNotification", null)
    setNotifications(null)
  }
  return (
    <div className="headerContainer row shadow-1 bgWhite">
      <div className={isMobile ? "mobGutter" : "homeGutter"} style={{ display: appType === "MobileApp" ? 'unset' : 'flex',}}>
        {isMobile ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
            <div className="hamburgerBtn" onClick={props.toggleDrawer} style={{ cursor: 'pointer' }}>
              <img alt="menu" src={hamburgerIcon} />
            </div>
            {appType !== "MobileApp" && (
              <Link
                underline="hover"
                color="text.primary"
                href={webView ? "/auth" :"/"}
                aria-current="page"
              >
                <img alt="home-logo" src={home} width={26}/>
              </Link>
            )}
          </div>
        ) : (
          <div className="hamburgerBtn" onClick={props.toggleDrawer}>
            <img alt="" src={hamburgerIcon} />
          </div>
        )}
      </div>
      <div className="headerViewNavContainer">
        <div className="navWrapper">
          {isMobile ? 
            <div className="icon" onClick={userProfile}>
              <MySchool style={{ maxWidth: isMobile ? '285px' : '400px', maxHeight: '40px' }} />
            </div> :
          <Link href={isMobile ? "/auth" : "/"} className="icon">
            <MySchool style={{ maxWidth: isMobile ? '285px' : '400px', maxHeight: '40px' }} />
          </Link> }
          {/* { isMobile ? null : <DynamicBreadcrumb />} */}
        </div>
        <div className="navWrapper justifyContent">
          {/* Credits Display - hide for Super Admin */}
          {!isMobile && !isUnlimited && credits !== null && (
            <Chip
              icon={<AccountBalanceWalletIcon sx={{ fontSize: 16 }} />}
              label={`${credits} Credits`}
              size="small"
              color={creditWarning?.level === 'critical' ? 'error' : creditWarning?.level === 'warning' ? 'warning' : 'primary'}
              variant="outlined"
              sx={{ 
                marginRight: 2,
                fontWeight: 600,
                cursor: 'pointer',
                '&:hover': { backgroundColor: '#f0f0f0' }
              }}
              onClick={() => navigate('/auth/subscription')}
              title={creditWarning?.message || `You have ${credits} credits`}
            />
          )}
          {/* User Info Display */}
          {!isMobile && (userName || userRole) && (
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'flex-end', 
              marginRight: 2,
              padding: '4px 12px',
              borderRadius: '8px',
              backgroundColor: '#f5f5f5'
            }}>
              {userName && (
                <Typography 
                  variant="body2" 
                  sx={{ fontWeight: 600, color: '#333', fontSize: '14px' }}
                >
                  {userName}
                </Typography>
              )}
              {userRole && (
                <Typography 
                  variant="caption" 
                  sx={{ color: '#666', fontSize: '11px' }}
                >
                  {formatRole(userRole)}
                </Typography>
              )}
            </Box>
          )}
          <div className="profileLogo" style={{ paddingTop: "7px" }}>
            <IconButton
              id="notificationBtn"
              aria-controls={notificationOpen ? "basic-menu-notification" : undefined}
              aria-haspopup="true"
              aria-expanded={notificationOpen ? "true" : undefined}
              style={{ border: '1px solid #8fb4ff', marginRight: 10 }}
              onClick={(e) => handleClick(e, true)}
            >
              <NotificationsNoneIcon fontSize="small" />
            </IconButton>
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
              onClose={() => handleClose(false)}
              MenuListProps={{
                "aria-labelledby": "avatarBtn",
              }}
            >
              <MenuItem className="linkTypoProxima" onClick={() => { navigate('/auth'); handleClose(false); }}>
                Dashboard
              </MenuItem>
              <MenuItem className="linkTypoProxima" onClick={userProfile}>
                Profile
              </MenuItem>
              <MenuItem className="linkTypoProxima" 
                onClick={userLogout}>
                Logout
              </MenuItem>
            </Menu>
            <RenderNotification />
          </div>
        </div>
      </div>
      <div className="homeGutter indiaFlag" />
    </div>
  );
};
export default TopNavbar;
