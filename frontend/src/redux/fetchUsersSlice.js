import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
export const ListUsers = createAsyncThunk(
    'auth/listUsers',
    async (data, { rejectWithValue }) => {
        try {
            let headers = data.headers
            let response = await axios.request({
                baseURL: process.env.REACT_APP_BACKEND_URL + "/api",
                url: data?.url,
                method: data?.method,
                headers: headers,
                params: data?.body
            })
            return response.data
        } catch (err) {
            return rejectWithValue(err.response.data);
        }
    })
export const UserAccess = createAsyncThunk(
    'auth/userAccess',
    async (data, {rejectWithValue}) => {
        try {
            let header = data.headers
            let response = await axios.request({
                baseURL: process.env.REACT_APP_BACKEND_URL + "/api",
                url : '/rest/users/disableAccount',
                method : "POST",
                headers : header,
                data : data?.body
            })
            return response.data
        } catch (err) {
            return rejectWithValue(err.response.data)
        }
    }
)
export const UserCredits = createAsyncThunk(
    'auth/userCredits',
    async (data, {rejectWithValue}) => {
        try {
            let header = data.headers
            let response = await axios.request({
                baseURL: process.env.REACT_APP_BACKEND_URL + "/api",
                url : '/rest/users/updateCredits',
                method : "PATCH",
                headers : header,
                data : data?.body
            })
            return response.data
        } catch (err) {
            return rejectWithValue(err.response.data)
        }
    }
)
const fetchUsersSlice = createSlice({
    name: "usersList",
    initialState: {
        usersList: [],
        hasMore: false,
        loading: false
    },
    reducers: {
        updateUsers: (state, action) => {
            state.usersList = action.payload;
            state.loading = false;
        },
        clearUsers: (state) => {
            state.usersList = [];
            state.hasMore = false;
            state.loading = false;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(ListUsers.fulfilled, (state, { payload }) => {
                state.usersList = payload?.data?.users
                state.hasMore = payload?.data?.hasMore
                state.loading = false;
            })
            .addCase(ListUsers.pending, (state) => {
                state.loading = true
                state.usersList = []
                state.hasMore = false
                state.msg = "Registration Started"
            })
            .addCase(ListUsers.rejected, (state, { payload }) => {
                state.usersList = payload
                state.loading = false;
            })
            .addCase(UserAccess.fulfilled, (state) => {
                state.loading = false;
            })
            .addCase(UserAccess.pending, (state) => {
                state.msg = "Performing Action!!"
            })
            .addCase(UserAccess.rejected, (state) => {
                state.loading = false;
            })
            .addCase(UserCredits.fulfilled, (state) => {
                state.loading = false;
            })
            .addCase(UserCredits.pending, (state) => {
                state.msg = "Performing Action!!"
            })
            .addCase(UserCredits.rejected, (state) => {
                state.loading = false;
            })
    }
});
export const { updateUsers, clearUsers } = fetchUsersSlice.actions;
export default fetchUsersSlice.reducer;
