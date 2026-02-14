import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { apiCallBegan } from "./api";
import axios from "axios";
import jwt_decode from "jwt-decode";
// Get backend URL from environment variable
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API_BASE_URL = `${BACKEND_URL}/api/rest`;
export const authRegister = createAsyncThunk(
    'auth/register',
    async (data, { rejectWithValue }) => {
        try {
            let response = await axios.request({
                baseURL: API_BASE_URL,
                url: data?.url,
                method: data?.method,
                headers: {
                    "Content-type": "application/json",
                },
                data: data?.body
            })
            return response.data
        } catch (err) {
            return rejectWithValue(err.response?.data || { message: err.message });
        }
    })
export const RefreshToken = createAsyncThunk(
    'auth/refreshToken',
    async (data, { rejectWithValue }) => {
        try {
            let response = await axios.request({
                baseURL: API_BASE_URL,
                url: '/auth/refreshToken',
                method: "POST",
                headers: data?.headers,
                data: data?.body
            })
            return {...response.data, appType : data?.appType}
        } catch (err) {
            return rejectWithValue({...err.response?.data, appType : data?.appType});
        }
    }
)
export const UpdatePassword = createAsyncThunk(
    'auth/updatePassword',
    async (data, { rejectWithValue }) => {
        try {
            let response = await axios.request({
                baseURL: API_BASE_URL,
                url: '/auth/newPasswordChallenge',
                method: "POST",
                headers: data?.headers,
                data : data?.body
            })
            return response.data
        } catch (err) {
            return rejectWithValue(err.response?.data || { message: err.message });
        }
    }
)
export const userLogin = createAsyncThunk(
    'auth/login',
    async (data, { rejectWithValue }) => {
        try {
            let response = await axios.request({
                baseURL: API_BASE_URL,
                url: '/auth/login',
                method: "POST",
                headers: data?.headers,
                data : data?.body
            })
            return response.data
        } catch (err) {
            return rejectWithValue(err.response?.data || { message: err.message });
        }
    }
)
export const sendOtpThunk = createAsyncThunk(
    'auth/sendOtp',
    async (data, { rejectWithValue }) => {
        try {
            let response = await axios.get(`${API_BASE_URL}/auth/sendOtp?phoneNumber=${data.phoneNumber}`)
            return response.data
        } catch (err) {
            return rejectWithValue(err.response?.data || { message: err.message });
        }
    }
)
export const forgotPwd = createAsyncThunk(
    'auth/forgotPassword',
    async (data, { rejectWithValue }) => {
        try {
            let response = await axios.get(`${API_BASE_URL}/auth/forgotPassword?email=${data.user}`)
            return response.data
        } catch (err) {
            return rejectWithValue(err.response?.data || { message: err.message });
        }
    }
)
export const newPwdLogin = createAsyncThunk(
    'auth/confirmPassword',
    async (data, { rejectWithValue }) => {
        try {
            let response = await axios.request({
                baseURL: API_BASE_URL,
                url: '/auth/confirmPassword',
                method: "POST",
                headers: data?.headers,
                data : data?.body
            })
            return response.data
        } catch (err) {
            return rejectWithValue(err.response?.data || { message: err.message });
        }
    } 
)
export const userOtpLogin = createAsyncThunk(
    'auth/otpLogin',
    async (data, { rejectWithValue }) => {
        try {
            let response = await axios.request({
                baseURL: API_BASE_URL,
                url: '/auth/loginViaOtp',
                method: "POST",
                headers: data?.headers,
                data : data?.body
            })
            return response.data
        } catch (err) {
            return rejectWithValue(err.response?.data || { message: err.message });
        }
    }
)
const loginSlice = createSlice({
    name: "user",
    initialState: {
        refreshToken: null,
        accessToken: null,
        tokenExpiry : null,
        userRole : null,
        isLoggedin: false,
        loading: false,
        appType: 'none'
    },
    reducers: {
        logoutUser: (state) => {
            state.refreshToken = null
            state.accessToken = null
            state.userRole = null
            state.tokenExpiry = null
            state.isLoggedin = false;
            state.loading = false
        },
    },
    extraReducers: (builder) => {
        builder
            // Auth Register
            .addCase(authRegister.fulfilled, (state, { payload }) => {
                state.msg = payload
                state.loading = false;
            })
            .addCase(authRegister.pending, (state) => {
                state.loading = true;
                state.msg = "Registration Started"
            })
            .addCase(authRegister.rejected, (state, { payload }) => {
                state.msg = payload
                state.loading = false;
            })
            // Refresh Token
            .addCase(RefreshToken.fulfilled, (state, { payload }) => {
                if (payload?.accessToken) {
                    state.refreshToken = payload.refreshToken
                    state.accessToken = payload.accessToken
                    try {
                        const decoded = jwt_decode(payload.accessToken);
                        state.userRole = decoded['cognito:groups']?.[0] || decoded.role
                        state.tokenExpiry = decoded['exp']
                    } catch (e) {
                        console.error('JWT decode error:', e);
                    }
                    state.isLoggedin = true;
                }
                if(payload?.appType) state.appType = payload.appType
                state.loading = false;
            })
            .addCase(RefreshToken.pending, (state) => {
                state.loading = true;
            })
            .addCase(RefreshToken.rejected, (state, { payload }) => {
                state.loading = false;
                if(payload?.appType) state.appType = payload.appType
                state.msg = "Something Wrong !!"
            })
            // Update Password
            .addCase(UpdatePassword.fulfilled, (state, { payload }) => {
                if (payload?.accessToken) {
                    state.refreshToken = payload.refreshToken
                    state.accessToken = payload.accessToken
                    try {
                        const decoded = jwt_decode(payload.accessToken);
                        state.userRole = decoded['cognito:groups']?.[0] || decoded.role
                        state.tokenExpiry = decoded['exp']
                    } catch (e) {
                        console.error('JWT decode error:', e);
                    }
                    state.isLoggedin = true;
                }
                state.loading = false;
            })
            .addCase(UpdatePassword.pending, (state) => {
                state.loading = true
            })
            .addCase(UpdatePassword.rejected, (state, { payload }) => {
                state.msg = "Something Wrong !!"
                state.loading = false;
            })
            // User Login
            .addCase(userLogin.pending, (state) => {
                state.loading = true;
            })
            .addCase(userLogin.fulfilled, (state, { payload }) => {
                if (payload?.accessToken) {
                    state.refreshToken = payload.refreshToken
                    state.accessToken = payload.accessToken
                    try {
                        const decoded = jwt_decode(payload.accessToken);
                        state.userRole = decoded['cognito:groups']?.[0] || decoded.role
                        state.tokenExpiry = decoded['exp']
                    } catch (e) {
                        console.error('JWT decode error:', e);
                    }
                    state.isLoggedin = true;
                }
                state.loading = false;
            })
            .addCase(userLogin.rejected, (state, { payload }) => {
                state.loading = false;
            })
            // OTP Login
            .addCase(userOtpLogin.pending, (state) => {
                state.loading = true;
            })
            .addCase(userOtpLogin.fulfilled, (state, { payload }) => {
                if (payload?.accessToken) {
                    state.refreshToken = payload.refreshToken
                    state.accessToken = payload.accessToken
                    try {
                        const decoded = jwt_decode(payload.accessToken);
                        state.userRole = decoded['cognito:groups']?.[0] || decoded.role
                        state.tokenExpiry = decoded['exp']
                    } catch (e) {
                        console.error('JWT decode error:', e);
                    }
                    state.isLoggedin = true;
                }
                state.loading = false;
            })
            .addCase(userOtpLogin.rejected, (state, { payload }) => {
                state.loading = false;
            });
    }
});
export default loginSlice.reducer;
export const { logoutUser } = loginSlice.actions
