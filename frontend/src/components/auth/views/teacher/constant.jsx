import { Button, styled, Switch, Typography, IconButton, Tooltip } from "@mui/material";
import React from "react";
import CheckBtnIcon from "../../../../assests/checkBtnIcon.svg";
import { ReactComponent as SettingsIcon } from "../../../../assests/blueSettingIcon.svg";
import EditIcon from "@mui/icons-material/Edit";
import { UserAccess } from "../../../../redux/fetchUsersSlice";
import { useDispatch, useSelector } from "react-redux";
import CreditDialog from "../../../../uicomponent/CreditsDialog/index";
import { isMobile } from "react-device-detect";
import  Crossicon from "../../../../assests/homeScreen/crossicon.svg";
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
const HandleBtnRender = (params, direction, onEdit) => {
  const [open, setOpen] = React.useState(false);
  const dispatch = useDispatch();
  const { accessToken, refreshToken, tokenExpiry } = useSelector(
    (state) => state.login
  );
  let header = {
    "Content-Type": "application/json",
    Accept: "application/json",
    Authorization: `Bearer ${accessToken}`,
  };
  const handleUserAccess = (checked, params) => {
    dispatch(
      UserAccess({
        headers: header,
        body: {
          userId: params.row.userId,
          disable: checked,
        },
      })
    );
  };
  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
        {direction === "left" || direction === "center" ? (
          <>
            <ToggleSwitch className='toggleSwitch'
              defaultChecked={params.row.disabled}
              onChange={(e) => handleUserAccess(e.target.checked, params)}
            />
          </>
        ) : null}
        {direction === "right" || direction === "center" ? (
          <>
            {onEdit && (
              <Tooltip title="Edit Teacher">
                <IconButton 
                  size="small" 
                  onClick={() => onEdit(params.row)}
                  sx={{ color: '#3C5EA2' }}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title="Manage Credits">
              <Button
                variant="outlined"
                className="manageBtn"
                onClick={() => setOpen(true)}
                startIcon={<SettingsIcon />}
                sx={{ whiteSpace: 'nowrap', minWidth: 'auto', px: 1, fontSize: isMobile ? 10 : 12 }}
              >
                Credits
              </Button>
            </Tooltip>
            <CreditDialog
              open={open}
              handleClose={() => setOpen(false)}
              params={params}
            />
          </>
        ) : null}
      </div>
    </>
  );
};
// Base columns for teachers (exported for use in getTeacherColumns)
export const teacherColumns = [
  {
    field: "teacherCode",
    headerName: "Teacher Code",
    width: 110,
    minWidth: 90,
    editable: false,
    sortable: true,
  },
  {
    field: "email",
    headerName: "Teacher ID",
    width: 160,
    minWidth: 130,
    flex: 0.5,
    editable: false,
    sortable: true,
  },
  {
    field: "name",
    headerName: "Teacher Name",
    width: 120,
    minWidth: 100,
    flex: 0.5,
    editable: false,
    sortable: true,
    cellClassName: "textFontProxima blueColorText",
  },
  {
    field: "mobileNumber",
    headerName: "Mobile Number",
    width: 115,
    minWidth: 100,
    editable: false,
    sortable: true,
    cellClassName: "textFontProxima blueColorText",
  },
  {
    field: "schoolCode",
    headerName: "School Code",
    width: 100,
    minWidth: 85,
    editable: false,
    sortable: true,
  },
  {
    field: "schoolName",
    headerName: "School Name",
    width: 130,
    minWidth: 100,
    flex: 0.5,
    editable: false,
    sortable: true,
    renderCell: (params) => {
      return <div>{params.row.schoolName || '-'}</div>;
    },
  },
  {
    field: "cityState",
    headerName: "City, State",
    width: 120,
    minWidth: 90,
    editable: false,
    sortable: true,
    renderCell: (params) => {
      const city = params.row.city || '';
      const state = params.row.state || '';
      if (!city && !state) return <div>-</div>;
      const fullText = `${city}${city && state ? ', ' : ''}${state}`;
      return (
        <Tooltip title={fullText} arrow placement="top">
          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'pointer' }}>
            {fullText}
          </div>
        </Tooltip>
      );
    },
  },
  {
    field: "credits",
    headerName: "Credits",
    width: 70,
    minWidth: 55,
    editable: false,
    sortable: true,
    renderCell: (params) => {
      return <div>{params.row.credits == null ? 0 : params.row.credits}</div>;
    },
  },
  {
    field: "actions",
    headerName: "Actions",
    width: 230,
    minWidth: 210,
    sortable: false,
    renderCell: (params) => HandleBtnRender(params, 'center'),
    editable: false,
  },
];

export const columns = teacherColumns;

// Export function to get columns with onEdit handler
export const getTeacherColumns = (onEdit) => [
  ...teacherColumns.slice(0, -1),
  {
    field: "enable",
    headerName: "Actions",
    width: 230,
    minWidth: 200,
    renderCell: (params) => HandleBtnRender(params, 'center', onEdit),
    editable: false,
  },
];

export const teacherMobileViewColumns = [
  {
    field: "teacherCode",
    flex: 0.5,
    headerName: (
      <div>
        <Typography>Teacher Code</Typography>
        <Typography>Teacher ID</Typography>
        <Typography>Teacher Name</Typography>
      </div>
    ),
    renderCell: (props) => (
      <div>
        <Typography>{props.row.teacherCode}</Typography>
        <Typography>{props.row.email}</Typography>
        <Typography>
          {props.row.name}, {props.row.state}
        </Typography><br/>
        <>{HandleBtnRender(props, "left")}</>
      </div>
    ),
  },
  {
    fieldName: "enable",
    flex: 0.5,
    headerName: (
      <div>
        <Typography>Mobile No</Typography>
        <Typography>City, State </Typography>
        <Typography>Students Enrolled</Typography>
      </div>
    ),
    renderCell: (props, direction) => (
      <div>
        <Typography>{props.row.mobileNumber || '-'}</Typography>
        <Typography>{props.row.city || ''}{props.row.city && props.row.state ? ', ' : ''}{props.row.state || '-'}</Typography>
         <Typography>{props.row.studentsEnrolled ? props.row.studentsEnrolled : "N/A"}</Typography><br/>
        {HandleBtnRender(props, "right")}   
      </div>
    ),
  },
];
