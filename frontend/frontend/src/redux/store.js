import { configureStore, getDefaultMiddleware } from "@reduxjs/toolkit";
import { persistReducer } from "redux-persist";
import apiReducer from "./apiSlice";
import localStorage from 'redux-persist/lib/storage'
import { combineReducers } from "@reduxjs/toolkit";
import loginReducer from "./authSlice";
import fetchUsersSlice from "./fetchUsersSlice";
import myProfileSlice from "./myProfileSlice";
import api from "./middleware/api";
import { SnackbarReducer } from "./snackbarSlice";
import addImagesSlice from "./addImagesSlice";
import fetchSearchSlice from "./fetchSearchSlice";
import makersTemplateSlice from "./makersTemplateSlice";
import  userProtectedSlice  from "./protectSlice";
import loadOldImageReducer from "./loadOldImage";
import pendingImageApprovalSlice from "./pendingApprovalSlice";
const persistConfig = {
  timeout: 100,
  key: "ms",
  storage: localStorage,
};
const persistedReducer = persistReducer(persistConfig, loginReducer);
const protectedpersistedReducer = persistReducer(persistConfig, userProtectedSlice);
const reducer = combineReducers({
  api: apiReducer,
  login: persistedReducer,
  usersList : fetchUsersSlice,
  myProfile : myProfileSlice,
  snackbar : SnackbarReducer,
  imagesData : addImagesSlice,
  searchedImage : fetchSearchSlice,
  makersData : makersTemplateSlice,
  protecttedUser:protectedpersistedReducer,
  loadOldImage : loadOldImageReducer,
  pendingImageApproval : pendingImageApprovalSlice,
});
export default configureStore({
  reducer: reducer, 
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }).concat(api)
});
