import { useDispatch } from "react-redux";
import { SnackbarActions, snackbarInitialState } from "../redux/snackbarSlice";
export const useSnackbar = () => {
  const dispatch = useDispatch();
  const displaySnackbar = (snackbar) => {
    dispatch(SnackbarActions.addSnackbar(snackbar));
  };
  const clearSnackbar = () => {
    dispatch(SnackbarActions.clearSnackbar());
  };
  return { displaySnackbar, clearSnackbar };
};