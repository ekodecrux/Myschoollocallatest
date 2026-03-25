import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
export const userUploadFile = createAsyncThunk(
    'auth/userUploadFile',
    async (data, { rejectWithValue }) => {
        try {
            let headers = data.headers
            let response = await axios.request({
                baseURL: process.env.REACT_APP_BACKEND_URL + "/api",
                url: '/rest/images/submitForApproval',
                method: 'POST',
                headers : headers,
                data: data?.body
            })
            return response.data
        } catch (err) {
            return rejectWithValue(err.response.data);
        }
    })
const userUploadFileSlice = createSlice({
    name: "userUploadFile",
    initialState: {
        loading: false
    },
    reducers : {},
    extraReducers: (builder) => {
        builder
            .addCase(userUploadFile.fulfilled, (state) => {
                state.loading = false;
            })
            .addCase(userUploadFile.pending, (state) => {
                state.loading = true
            })
            .addCase(userUploadFile.rejected, (state) => {
                state.loading = false;
            })
    }
});
export default userUploadFileSlice.reducer;
