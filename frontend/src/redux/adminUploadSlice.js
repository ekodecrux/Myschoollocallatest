import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
export const adminUploadFile = createAsyncThunk(
    'auth/adminUploadFile',
    async (data, { rejectWithValue }) => {
        try {
            let headers = data.headers
            let response = await axios.request({
                baseURL: process.env.REACT_APP_BACKEND_URL + "/api",
                url: '/admin/upload-image',
                method: 'POST',
                headers : headers,
                data: data?.body
            })
            return response.data
        } catch (err) {
            return rejectWithValue(err.response.data);
        }
    })
const adminUploadFileSlice = createSlice({
    name: "adminUploadFile",
    initialState: {
        loading: false
    },
    reducers : {},
    extraReducers: (builder) => {
        builder
            .addCase(adminUploadFile.fulfilled, (state) => {
                state.loading = false;
            })
            .addCase(adminUploadFile.pending, (state) => {
                state.loading = true
            })
            .addCase(adminUploadFile.rejected, (state) => {
                state.loading = false;
            })
    }
});
export default adminUploadFileSlice.reducer;
