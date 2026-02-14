import { Button, Typography, Tabs, Tab, Box } from "@mui/material";
import React from "react";
import AuthSearchField from "../../../../customTheme/authSearchField/AuthSearchField";
import "./ImageScreen.css";
import imageicon from "../../../../assests/dummyImages/imges.svg";
import Pagination from "@mui/material/Pagination";
import { isMobile } from "react-device-detect";
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from "react-redux";
import ImageRenderer from "../imageRenderer/ImageRenderer";
import { GetFavImages, GetMyImages } from "../../../../redux/addImagesSlice";
import { RefreshToken } from "../../../../redux/authSlice";
import { pendingApproval } from "../../../../redux/pendingApprovalSlice";
import UploadFile from "./Tabs/UploadFile";
import FavImages from "./Tabs/FavImages";
import PendingApproval from "./Tabs/PendingApproval";
import MyImages from "./Tabs/MyImages";
import AdminUploadFile from "./Tabs/AdminUploadFile";
import { tabsRender } from "./constant";
import CreditsDisplay from "../../../common/CreditsDisplay";
function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}
TabPanel.propTypes = {
  children: PropTypes.node,
  index: PropTypes.number.isRequired,
  value: PropTypes.number.isRequired,
};
function a11yProps(index) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}
const ImageScreenInitializer = () => {
  const [pendingImages, setPendingImages] = React.useState([]);
  const [value, setValue] = React.useState(0); // value denotes to tabs number here
  const { images, hasMore, loading } = useSelector((state) => state.imagesData)
  const { refreshToken, accessToken, userRole } = useSelector((state) => state.login);
  // const { url } = useSelector((state) => state.pendingImageApproval);
  const dispatch = useDispatch()
  // Function handle change of tabs 
  // [0 - My Images, 1 - Favorite Images]
  const handleChange = (event, newValue) => {
    setValue(newValue);
  };
  return (
    <div className="myImageMainContainer">
      <div className="homeGutter" />
      <div className="myImageTextContainer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img alt="" src={imageicon} />
          {userRole === "ADMIN" || userRole === "SUPER_ADMIN" ? <Typography fontSize="20px" fontWeight={400} fontFamily={"Proxima Nova"} className='imageHeading'>
            {value === 0 ? "Images For Approval" : "Upload File"}
          </Typography> : <Typography fontSize="20px" fontWeight={400} fontFamily={"Proxima Nova"} className='imageHeading'>
            {value === 0 ? "My Images" : value === 1 ? "Favourite Images" : "Upload File"}
          </Typography>}
        </div>
        <CreditsDisplay showLabel={true} size="small" />
      </div>
      {/* <div className="homeGutter" /> */}
      <div>
        <div className='heading'>
          <div className="myImageSearchbarContainer">
            <div className='myImageSearchAuthSearchFieldContainer' style={{ display: 'none', flex: 1, gap: 20 }}>
              <AuthSearchField
                id="signUpEmail"
                type="email"
                placeholder="Search by Image Name Or Image Category"
              />
              <Button variant="outlined" className="authSearchbtn">
                Search
              </Button>
            </div>
            <Tabs value={value} onChange={handleChange} disableRipple
              sx={{
                ".MuiTabs-flexContainer": {
                  justifyContent: isMobile ? 'center' : 'flex-end'
                },
                ".MuiTabs-indicator": {
                  display: 'none'
                }
              }}
              className="myImageTabMenuContainer" >
              {userRole === "ADMIN" || userRole === "SUPER_ADMIN" ? null : <Tab label={
                <span className="authSearchbtn" style={{ 
                  padding: '6px 16px', 
                  border: '1px solid rgba(0, 0, 0, 0.23)', 
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}>
                  My Images
                </span>
              } {...a11yProps(0)} />}
              {userRole === "ADMIN" || userRole === "SUPER_ADMIN" ? null : <Tab label={
                <span className="authSearchbtn" style={{ 
                  padding: '6px 16px', 
                  border: '1px solid rgba(0, 0, 0, 0.23)', 
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}>
                  Favourite Images
                </span>
              } {...a11yProps(1)} />}
              {(userRole === "ADMIN" || userRole === "SUPER_ADMIN") ? <Tab label={
                <span className="authSearchbtn" style={{ 
                  padding: '6px 16px', 
                  border: '1px solid rgba(0, 0, 0, 0.23)', 
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}>
                  Images for Approval
                </span>
              } {...a11yProps(0)} /> : null}
              {isMobile ? null : <Tab label={
                <span className="authSearchbtn" style={{ 
                  padding: '6px 16px', 
                  border: '1px solid rgba(0, 0, 0, 0.23)', 
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}>
                  Upload File
                </span>
              } {...a11yProps((userRole === "ADMIN" || userRole === "SUPER_ADMIN") ? 1 : 2)} />}
            </Tabs>
            {/* <Tabs value={value} onChange={handleChange} disableRipple
              sx={{
                ".MuiTabs-flexContainer": {
                  justifyContent: isMobile ? 'center' : 'flex-end'
                },
                ".MuiTabs-indicator": {
                  display: 'none'
                }
              }}
              className="myImageTabMenuContainer">
              {tabsRender.map((k, i) => {
                return
                <Tab label={k.label} />
              })}
            </Tabs> */}
          </div>
          <div>
            <TabPanel value={value} index={0}>
              {(userRole === "ADMIN" || userRole === "SUPER_ADMIN") ? 
                <PendingApproval pendingImages={pendingImages} /> : 
                <MyImages value={value} />
              }
            </TabPanel>
            <TabPanel value={value} index={1}>
              {(userRole === "ADMIN" || userRole === "SUPER_ADMIN") ? 
                <AdminUploadFile /> : 
                <FavImages />
              }
            </TabPanel>
            <TabPanel value={value} index={2} className="myImageUploadTabContainer">
              <UploadFile />
            </TabPanel>
          </div>
        </div>
        <div className="homeGutter" />
      </div>
    </div>
  );
};
export default ImageScreenInitializer;