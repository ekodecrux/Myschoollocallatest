import * as React from "react";
import StudentsIcon from "../../../../assests/auth/studentsIcon.svg";
import { ReactComponent as AddIcon } from "../../../../assests/AddIcon.svg";
import { ReactComponent as ImportExcelIcon } from "../../../../assests/ImportExcelIcon.svg";
import { Button, Typography } from "@mui/material";
import {styled, Switch } from "@mui/material";
import CheckBtnIcon from "../../../../assests/checkBtnIcon.svg";
import { ReactComponent as SettingsIcon } from "../../../../assests/blueSettingIcon.svg";
import { ReactComponent as DeleteIcon } from "../../../../assests/auth/deletered.svg";
const ToggleSwitch = styled((props) => (
  <Switch focusVisibleClassName=".Mui-focusVisible" disableRipple {...props} />
))(({ theme }) => ({
  width: 52,
  height: 26,
  padding: 0,
  paddingBottom: 2,
  "& .MuiSwitch-switchBase": {
    padding: 0,
    margin: 2,
    transitionDuration: "300ms",
    "&.Mui-checked": {
      transform: "translateX(26px)",
      color: "#fff",
      "& + .MuiSwitch-track": {
        backgroundColor: "white",
        opacity: 1,
        border: "1px solid #3C5EA2",
      },
      "&.Mui-disabled + .MuiSwitch-track": {
        opacity: 0.5,
      },
    },
    "&.Mui-focusVisible .MuiSwitch-thumb": {
      color: "#3C5EA2",
      border: "6px solid #fff",
    },
    "&.Mui-disabled .MuiSwitch-thumb": {
      color:
        theme.palette.mode === "light"
          ? theme.palette.grey[100]
          : theme.palette.grey[600],
    },
    "&.Mui-disabled + .MuiSwitch-track": {
      opacity: theme.palette.mode === "light" ? 0.7 : 0.3,
    },
  },
  "& .MuiSwitch-switchBase.Mui-checked .MuiSwitch-thumb": {
    background: `url(${CheckBtnIcon})`,
  },
  "& .MuiSwitch-thumb": {
    boxSizing: "border-box",
    width: 22,
    height: 22,
    background:
      "transparent linear-gradient(180deg, #335089 0%, #5888EA 100%) 0% 0% no-repeat",
  },
  "& .MuiSwitch-track": {
    borderRadius: 26 / 2,
    backgroundColor: "white",
    border: "1px solid #3C5EA2",
    opacity: 1,
    transition: theme.transitions.create(["background-color"], {
      duration: 500,
    }),
  },
}));
// const handleBtnRender = (params) => {
//   return (
//     <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
//       <ToggleSwitch />
//       <Typography>{params.enable ? "Enable" : "Disable"}</Typography>
//       <Button
//         variant="outlined"
//         className="manageBtn"
//         startIcon={<SettingsIcon />}
//       >
//         Manage Credits
//       </Button>
//          <Button variant="outlined" className="manageBtn" startIcon={<DeleteIcon/>} style={{borderRadius:'8px',height:'30px',width:'20px'}}/> 
//         {/* <input type="button" className="manageBtn" value='submit' startIcon={<DeleteIcon/>}/> */}
//     </div>
//   );
// };
export const columns = [
   {
     field: "subscriptionCode",
     headerName: "schoolCode",
    flex: 0.20,
   },
  {
    field: "Subjectname",
    headerName: "SubjectName",
    flex: 0.22,
    editable: false,
    cellClassName: "textFontProxima blueColorText",
  },
  {
    field: "IssueDate",
    headerName: "ISsueDate Name",
    flex: 0.2,
    editable: false,
  },
  {
    field: "ExpiaryDate",
    headerName: "Expiary Date",
    flex: 0.2,
    editable: false,
  },
  {
    field: "creditLeft",
    headerName: "Credit Left",
    flex: 0.2,
    editable: false,
  },
  {
    field: "actions",
    headerName: "Actions",
    flex: 0.98,
  },
];
export const data = [
  {
    schoolCode: 987654321,
    Subjectname: "Rohit Singh",
    IssueDate: "Delhi, New Delhi",
    ExpiaryDate: "Mr. Shrawan Singh",
    creditLeft: 12,
  },
];
