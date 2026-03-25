import { createSlice } from "@reduxjs/toolkit";
export const userProtectedSlice = createSlice({
  name: "user",
  initialState: {
    protectedCode: 911,
    isProtected: false,  // Disabled by default - set to true if OTP verification needed
    refreshToken: null,
    accessToken: null,
    tokenExpiry : null,
    userRole : null,
  },
  reducers: {
    protectted: (state, action) => {
      state.isProtected = false;
      state.refreshToken = null
      state.accessToken = null
      state.userRole = null
      state.tokenExpiry = null
    },
  },
});
export const { protectted} = userProtectedSlice.actions;
// export const selectUser = (state) => state.user.user;
export default userProtectedSlice.reducer;
