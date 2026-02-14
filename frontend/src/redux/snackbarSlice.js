import { AlertColor } from "@mui/material";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
export const snackbarInitialState = {
    open: false,
    type: "info",
    message: "",
    timeout: 3000
  };
export const snackbarSlice = createSlice({
  name: "snackbar",
  initialState: snackbarInitialState,
  reducers: {
    addSnackbar: (_state, action) => ({
      ...snackbarInitialState,
      ...action.payload,
      open: true
    }),
    clearSnackbar: (state) => ({ ...state, open: false })
  }
});
export const SnackbarActions = snackbarSlice.actions;
export const SnackbarReducer = snackbarSlice.reducer;