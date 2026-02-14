import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
export const pendingApproval = createAsyncThunk(
    'auth/pendingApproval',
    async (data, { rejectWithValue }) => {
        try {
            let response = await axios.request({
                baseURL: process.env.REACT_APP_BACKEND_URL + "/api",
                url: '/rest/images/admin/getPendingApprovals',
                method: "GET",
                headers: data?.headers,
                params : data?.body
            })
            return response.data
        } catch (err) {
            return rejectWithValue(err.response.data);
        }
    })
const pendingApprovalSlice = createSlice({
    name: "pendingApproval",
    initialState: {
        pendingImages: [],
        loading: false
    },
    reducers : {},
    extraReducers: (builder) => {
        builder
            .addCase(pendingApproval.fulfilled, (state, { payload }) => {
                state.pendingImages = payload.pendingImages
                state.loading = false;
            })
            .addCase(pendingApproval.pending, (state) => {
                state.loading = true
            })
            .addCase(pendingApproval.rejected, (state, { payload }) => {
                state.pendingImages = payload?.pendingImages
                state.loading = false;
            })
    }
});
export default pendingApprovalSlice.reducer;
