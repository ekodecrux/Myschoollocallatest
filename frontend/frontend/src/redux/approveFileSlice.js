import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
export const ApproveFile = createAsyncThunk(
    'auth/approveFile',
    async (data, { rejectWithValue }) => {
        try {
            let headers = data.headers
            let response = await axios.request({
                baseURL: process.env.REACT_APP_BACKEND_URL + "/api",
                url: '/rest/images/admin/approveFileUploadRequest',
                method: 'GET',
                headers : headers,
                params: data?.body
            })
            return response.data
        } catch (err) {
            return rejectWithValue(err.response.data);
        }
    })
const approveFileSlice = createSlice({
    name: "approveFile",
    initialState: {
        loading: false
    },
    reducers : {},
    extraReducers: (builder) => {
        builder
            .addCase(ApproveFile.fulfilled, (state) => {
                state.loading = false;
            })
            .addCase(ApproveFile.pending, (state) => {
                state.loading = true
            })
            .addCase(ApproveFile.rejected, (state) => {
                state.loading = false;
            })
    }
});
export default approveFileSlice.reducer;
