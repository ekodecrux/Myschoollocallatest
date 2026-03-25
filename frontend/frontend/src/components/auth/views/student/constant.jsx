import { Button, styled, Switch, Typography, IconButton, Tooltip } from "@mui/material";
import CheckBtnIcon from "../../../../assests/checkBtnIcon.svg";
import { ReactComponent as SettingsIcon } from "../../../../assests/blueSettingIcon.svg";
import { ReactComponent as DeleteIcon } from "../../../../assests/auth/deletered.svg";
import EditIcon from "@mui/icons-material/Edit";
import React from "react";
import { UserAccess } from "../../../../redux/fetchUsersSlice";
import { useDispatch, useSelector } from "react-redux";
import CreditDialog from "../../../../uicomponent/CreditsDialog/index";
import { isMobile } from "react-device-detect";
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
  const dispatch = useDispatch();
  const { accessToken, refreshToken, tokenExpiry } = useSelector(
    (state) => state.login
  );
  const { usersList } = useSelector((state) => state.usersList);
  const [open, setOpen] = React.useState(false);
  const [checked, setChecked] = React.useState(false);
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
              <Tooltip title="Edit Student">
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
export const columns = [
  {
    field: "schoolCode",
    headerName: "School Code",
    width: 90,
    minWidth: 75,
    sortable: true,
  },
  {
    field: "schoolName",
    headerName: "School Name",
    width: 115,
    minWidth: 90,
    flex: 0.5,
    sortable: true,
    renderCell: (params) => {
      return <div>{params.row.schoolName || '-'}</div>;
    },
  },
  {
    field: "studentCode",
    headerName: "Student Code",
    width: 100,
    minWidth: 85,
    sortable: true,
  },
  {
    field: "name",
    headerName: "Student Name",
    width: 115,
    minWidth: 90,
    flex: 0.5,
    editable: false,
    sortable: true,
    cellClassName: "textFontProxima blueColorText",
  },
  {
    field: "fatherName",
    headerName: "Parent Name",
    width: 105,
    minWidth: 85,
    editable: false,
    sortable: true,
  },
  {
    field: "mobileNumber",
    headerName: "Mobile No",
    width: 100,
    minWidth: 90,
    editable: false,
    sortable: true,
  },
  {
    field: "className",
    headerName: "Class",
    width: 60,
    minWidth: 50,
    editable: false,
    sortable: true,
  },
  {
    field: "sectionName",
    headerName: "Section",
    width: 65,
    minWidth: 50,
    editable: false,
    sortable: true,
  },
  {
    field: "rollNumber",
    headerName: "Roll No",
    width: 70,
    minWidth: 55,
    editable: false,
    sortable: true,
    renderCell: (params) => {
      return <div>{params.row.rollNumber}</div>;
    },
  },
  {
    field: "teacherName",
    headerName: "Teacher Name",
    width: 110,
    minWidth: 90,
    flex: 0.5,
    sortable: true,
    renderCell: (params) => {
      return <div>{params.row.teacherName || '-'}</div>;
    },
  },
  {
    field: "credits",
    headerName: "Credits",
    width: 65,
    minWidth: 50,
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
    renderCell: (params) => HandleBtnRender(params,'center'),
    editable: false,
  },
];

// Export function to get columns with onEdit handler
export const getStudentColumns = (onEdit) => {
  return columns.map(col => {
    if (col.field === 'actions') {
      return {
        ...col,
        renderCell: (params) => HandleBtnRender(params, 'center', onEdit)
      };
    }
    return col;
  });
};

export const data = [
  {
    hash: 1,
    studentId: 987654321,
    studentName: "Rohit Singh",
    fatherName: "Delhi, New Delhi",
    mobileNo: "Mr. Shrawan Singh",
    class: 12,
    section: 24,
    rollNo: 10,
    creditLeft: 1200,
    enable: false,
  },
];
export const StudentmobileViewColumns = [
  {
    field: "schoolCode",
    flex: 0.5,
    headerName: (
      <div>
        <Typography>School Code</Typography>
        <Typography>Student Name</Typography>
        <Typography>Parent Name</Typography>
      </div>
    ),
    renderCell: (props, direction) => (
      <div>
        <Typography>{props.row.schoolCode || '-'}</Typography>
        <Typography>{props.row.name || '-'}</Typography>
        <Typography>{props.row.fatherName || '-'}</Typography>
        <> {HandleBtnRender(props, "left")} </><br/>
      </div>
    ),
  },
  {
    fieldName: "enable",
    flex: 0.5,
    headerName: (
      <div>
        <Typography>Mobile No</Typography>
        <Typography>Class </Typography>
        <Typography>Section</Typography>
      </div>
    ),
    renderCell: (props) => (
      <div>
        <Typography>{props.row.mobileNumber || '-'}</Typography>
        <Typography>{props.row.className || '-'}</Typography>
        <Typography>{props.row.sectionName || '-'}</Typography>
        {HandleBtnRender(props, "right")} <br/>
      </div>
    ),
  },
];
