import * as React from 'react';
import { Box, Drawer, List, ListItemButton, ListItemIcon, Typography } from '@mui/material';
import { navigationData } from './constants.jsx';
import { NavLink } from 'react-router-dom';
import { isMobile } from 'react-device-detect';
import {ReactComponent as MySchool} from "../../../../assests/homeScreen/myschoolmobilelogo.svg";
import { ReactComponent as Crossicon } from '../../../../assests/homeScreen/crossicon.svg';
// import {ReactComponent as MySchool} from "../../../assests/homeScreen/myschoolmobilelogo.svg";
import { useSelector } from 'react-redux';
import jwt_decode from "jwt-decode";
import axios from 'axios';
import './SideNavStyle.css'

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const drawerWidth = isMobile ? "100%" : 200;

export default function SideNav(props) {
  const { accessToken } = useSelector((state) => state.login)
  const [userRole, setUserRole] = React.useState(null)
  const [canAccessSubscription, setCanAccessSubscription] = React.useState(false)
  
  React.useEffect(() => {
    var decoded = jwt_decode(accessToken);
    setUserRole(decoded['cognito:groups'][0]);
  }, [accessToken])
  
  // Check if user can access subscription page
  React.useEffect(() => {
    const checkSubscriptionAccess = async () => {
      if (!accessToken) return;
      try {
        const response = await axios.get(`${BACKEND_URL}/api/rest/users/checkCredits`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        setCanAccessSubscription(response.data.canAccessSubscription || false);
      } catch (e) {
        console.log("Error checking subscription access:", e);
      }
    };
    checkSubscriptionAccess();
  }, [accessToken]);
  
  // Check if menu item should be visible
  const shouldShowMenuItem = (item) => {
    // Handle subscription visibility based on user type and registration
    if (item.url === '/auth/subscription') {
      return canAccessSubscription;
    }
    // Handle other role-based visibility
    if (item.role[0] === 'EVERYONE') return true;
    return item.role.findIndex(ele => ele === userRole) > -1;
  };
  
  const handleNavLinkRender = () => {
    return (
      navigationData.map((k, i) =>
        <div key={`navigationData-${i}`} onClick={isMobile ? props.toggleDrawer : undefined}>
          {k.name !== "" ? <Typography className='sideNavListItemsHeading' >{k.name}</Typography> : null}
          <List >
            {k.children.map((ck, ci) => {
              if (shouldShowMenuItem(ck)) {
                return (
                  <NavLink end className={({isActive}) => isActive ? "sideNavLinkActive" : undefined}
                    style={{color:'#293859'}}
                    key={`listItems-navigationData-${ci}`} to={ck.url}>
                      <ListItemButton>
                        <ListItemIcon style={{ minWidth: 33, color:'inherit' }}>
                          {ck.icon}
                        </ListItemIcon>
                        <Typography className="linkTypoProxima" color={'inherit'}>{ck.name}</Typography>
                      </ListItemButton>
                  </NavLink>
                )
              }
              return null;
            }
            )}
          </List>
        </div>
      )
    )
  }
  return (
    <div className='sideNavContainer' >
      <Box sx={{ display: 'flex' }}>
        <Drawer
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              height: '100%',
              paddingTop: isMobile ? '60px' : '100px',
              border: 'none !important'
            }
          }}
          variant={isMobile ? "temporary" : "persistent"}
          // variant="temporary"
          open={props.drawerState}
          anchor="left"
        >
          {isMobile ? <div className="mobileSidenavLogo">
            <div className="sideNvaIcon">
             <MySchool style={{maxHeight:'40px',maxWidth:'177px'}}/> 
            </div>
            <div className ='sideNaveBarCrossIconContainer'  onClick={props.toggleDrawer}>
              <Crossicon color='black' />
            </div>
          </div> : null}
          {handleNavLinkRender()}
        </Drawer>
      </Box>
    </div>
  );
}
