import { Button, makeStyles, styled, Switch, Typography, IconButton, Tooltip } from "@mui/material";
import CheckBtnIcon from "../../../../assests/checkBtnIcon.svg";
import { ReactComponent as SettingsIcon } from "../../../../assests/blueSettingIcon.svg";
import EditIcon from "@mui/icons-material/Edit";
import CreditDialog from "../../../../uicomponent/CreditsDialog";
import React from "react";
import { UserAccess } from "../../../../redux/fetchUsersSlice";
import { useDispatch, useSelector } from "react-redux";
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
    padding: null,
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
  const [open, setOpen] = React.useState(false);
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
              <Tooltip title="Edit">
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
    width: 110,
    minWidth: 100,
    editable: false,
    sortable: true,
  },
  {
    field: "name",
    headerName: "School Name",
    width: 160,
    minWidth: 140,
    flex: 1,
    editable: false,
    sortable: true,
    cellClassName: "textFontProxima blueColorText",
  },
  {
    field: "principalName",
    headerName: "Principal",
    width: 130,
    minWidth: 110,
    editable: false,
    sortable: true,
    renderCell: (params) => {
      return <div>{params.row.principalName || '-'}</div>;
    },
  },
  {
    field: "mobileNumber",
    headerName: "Phone",
    width: 120,
    minWidth: 100,
    editable: false,
    sortable: true,
    renderCell: (params) => {
      return <div>{params.row.mobileNumber || '-'}</div>;
    },
  },
  {
    field: "cityState",
    headerName: "City, State",
    width: 140,
    minWidth: 120,
    flex: 0.5,
    editable: false,
    sortable: true,
    renderCell: (params) => {
      const city = params.row.city || '';
      const state = params.row.state || '';
      if (!city && !state) return <div>-</div>;
      const fullText = `${city}${city && state ? ', ' : ''}${state}`;
      return (
        <Tooltip title={fullText} arrow placement="top">
          <div 
            style={{ 
              overflow: 'hidden', 
              textOverflow: 'ellipsis', 
              whiteSpace: 'nowrap',
              cursor: 'pointer'
            }}
          >
            {fullText}
          </div>
        </Tooltip>
      );
    },
  },
  {
    field: "address",
    headerName: "Address",
    width: 150,
    minWidth: 120,
    flex: 0.5,
    editable: false,
    sortable: true,
    renderCell: (params) => {
      const address = params.row.address || '-';
      return (
        <Tooltip title={address} arrow placement="top">
          <div 
            style={{ 
              overflow: 'hidden', 
              textOverflow: 'ellipsis', 
              whiteSpace: 'nowrap',
              cursor: 'pointer'
            }}
          >
            {address}
          </div>
        </Tooltip>
      );
    },
  },
  {
    field: "teachersEnrolled",
    headerName: "Teachers",
    width: 90,
    minWidth: 80,
    editable: false,
    sortable: true,
    renderCell: (params) => {
      return <div>{params.row.teachersEnrolled || 0}</div>;
    },
  },
  {
    field: "studentsEnrolled",
    headerName: "Students",
    width: 90,
    minWidth: 80,
    editable: false,
    sortable: true,
    renderCell: (params) => {
      return <div>{params.row.studentsEnrolled || 0}</div>;
    },
  },
  {
    field: "credits",
    headerName: "Credits",
    width: 80,
    minWidth: 70,
    editable: false,
    sortable: true,
    renderCell: (params) => {
      return <div>{params.row.credits == null ? 0 : params.row.credits}</div>;
    },
  },
  {
    field: "actions",
    headerName: "Actions",
    width: 260,
    minWidth: 240,
    borderRadius: "10px",
    sortable: false,
    renderCell: (params) => HandleBtnRender(params,'center'),
    editable: false,
  },
  {
    field: "enable",
    headerName: "Enable",
    hide: true,
    sortable: false,
  },
];

// Function to create columns with edit callback
export const getColumnsWithEdit = (onEdit) => {
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

export const mobileViewColumns = [
  {
    field: "schoolCode",
    flex: 0.5,
    headerName: (
      <div>
        <Typography>School Code</Typography>
        <Typography>School Name</Typography>
        <Typography>Principal</Typography>
      </div>
    ),
    renderCell: (props) => (
      <div>
        <Typography>{props.row.schoolCode || '-'}</Typography>
        <Typography>{props.row.name || '-'}</Typography>
        <Typography>{props.row.principalName || '-'}</Typography>
        <Typography style={{fontSize: '0.8em', color: '#666'}}>{props.row.mobileNumber || '-'}</Typography>
        <Button style={{display: 'contents'}}> {HandleBtnRender(props, "left")} </Button><br/>
      </div>
    ),
  },
  {
    fieldName: "enable",
    flex: 0.5,
    headerName: (
      <div>
        <Typography>City, State</Typography>
        <Typography>Teachers</Typography>
        <Typography>Students</Typography>
      </div>
    ),
    renderCell: (props) => (
      <div>
        <Typography>{props.row.city || '-'}{props.row.city && props.row.state ? ', ' : ''}{props.row.state || ''}</Typography>
        <Typography>{props.row.teachersEnrolled || 0}</Typography>
        <Typography>{props.row.studentsEnrolled || 0}</Typography>
        {HandleBtnRender(props, "right")}<br/>
      </div>
    ),
  },
];
