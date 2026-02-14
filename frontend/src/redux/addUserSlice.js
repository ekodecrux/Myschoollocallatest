import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
export const addUser = createAsyncThunk(
    'auth/addUsers',
    async (data, { rejectWithValue }) => {
        try {
            let headers = data.headers
            let response = await axios.request({
                baseURL: process.env.REACT_APP_BACKEND_URL + "/api",
                url: '/rest/users/add',
                method: 'POST',
                headers : headers,
                data: data?.body
            })
            return response.data
        } catch (err) {
            return rejectWithValue(err.response.data);
        }
    })
const addUsersSlice = createSlice({
    name: "user",
    initialState: {
        loading: false
    },
    reducers : {},
    extraReducers: (builder) => {
        builder
            .addCase(addUser.fulfilled, (state, { payload }) => {
                state.loading = false;
                return payload
            })
            .addCase(addUser.pending, (state) => {
                state.loading = true
            })
            .addCase(addUser.rejected, (state, { payload }) => {
                state.loading = false;
                return payload
            })
    }
});
export default addUsersSlice.reducer;
