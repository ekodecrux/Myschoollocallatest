import { Button, Typography, Tabs, Tab, Box } from "@mui/material";
import MyImages from "./Tabs/MyImages";
import FavImages from "./Tabs/FavImages";
import PendingApproval from "./Tabs/PendingApproval";
import UploadFile from "./Tabs/UploadFile";
import AdminUploadFile from "./Tabs/AdminUploadFile";
export const tabsRender = [
  {
    label : <Button variant="outlined" className="authSearchbtn">My Images</Button>,
    component : <MyImages />,
    userRole : ''
  },
  {
    label : <Button variant="outlined" className="authSearchbtn">Favourite Images</Button>,
    component : <FavImages />,
    userRole : ''
  },
  {
    label : <Button variant="outlined" className="authSearchbtn">Images for Approval</Button>,
    component : <PendingApproval />,
    userRole : ''
  },
  {
    label : <Button variant="outlined" className="authSearchbtn">Upload File</Button>,
    component : <UploadFile />,
    userRole : ''
  },
  {
    label : <Button variant="outlined" className="authSearchbtn">Upload File</Button>,
    component : <AdminUploadFile />,
    userRole : ''
  },
];
