import * as React from 'react';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
// import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';
import { useSelector } from "react-redux";
// import { store } from "../../store";
import { useSnackbar } from "../../hook/useSnackbar";
import { Snackbar, Alert, SnackbarCloseReason } from "@mui/material";
// const Alert = React.forwardRef(function Alert(props, ref) {
//   return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
// });
export default function CustomSnackbar(props) {
  // const [open, setOpen] = React.useState(false);
  const snackbar = useSelector((state) => state.snackbar);
  const { clearSnackbar } = useSnackbar();
  // const handleClick = () => {
  //   setOpen(true);
  // };
  const handleClose = (_, reason) =>
    reason !== "clickaway" && clearSnackbar();
  //   setOpen(false);
  // };
  return (
      <Snackbar open={snackbar.open} autoHideDuration={snackbar.timeout} onClose={handleClose}>
        <Alert onClose={handleClose} severity={snackbar.type} variant="filled">
         {snackbar.message}
        </Alert>
      </Snackbar>
  );
}
