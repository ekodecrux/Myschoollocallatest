import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
export const MyProfile = createAsyncThunk(
    'auth/myProfile',
    async (data, { rejectWithValue }) => {
        try {
            let postData = data?.method === 'GET' ? {
                params: data?.body
            } : {
                data: data?.body
            }
            let response = await axios.request({
                baseURL: process.env.REACT_APP_BACKEND_URL + "/api",
                url: '/rest/users/getUserDetails',
                method: data?.method,
                headers: data?.headers,
                postData
            })
            return response.data
        } catch (err) {
            return rejectWithValue(err.response.data);
        }
    }
)
export const UpdateProfile = createAsyncThunk(
    'auth/updateProfile',
    async (data, { rejectWithValue }) => {
        try {
            let response = await axios.request({
                baseURL: process.env.REACT_APP_BACKEND_URL + "/api",
                url: '/rest/users/updateUserDetails',
                method: "PATCH",
                headers: data?.headers,
                data : data?.body
            })
            return response.data
        } catch (err) {
            return rejectWithValue(err.response.data);
        }
    }
)
const myProfileSlice = createSlice({
    name: "userDetails",
    initialState: {
        userDetails: {},
        loading: false
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(MyProfile.fulfilled, (state, { payload }) => {
                state.userDetails = payload
                state.loading = false
            })
            .addCase(MyProfile.pending, (state) => {
                state.loading = true
                state.userDetails = {}
            })
            .addCase(MyProfile.rejected, (state, { payload }) => {
                state.userDetails = payload
                state.loading = false;
            })
            .addCase(UpdateProfile.fulfilled, (state, { payload }) => {
                // Only update userDetails if payload contains actual user data
                if (payload && payload.id) {
                    state.userDetails = payload
                }
                state.loading = false
            })
            .addCase(UpdateProfile.pending, (state) => {
                state.loading = true
                // Don't clear userDetails during pending to prevent UI flickering
            })
            .addCase(UpdateProfile.rejected, (state, { payload }) => {
                // Don't overwrite userDetails on error
                state.loading = false;
            })
    }
});
export default myProfileSlice.reducer;
