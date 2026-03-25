import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { apiCallBegan } from "./api";
export const loadSingleImage = createAsyncThunk(
    'loadSingleImage',
    async (data, { rejectWithValue }) => {
        try {
            let headers = data.headers
            let response = await axios.request({
                baseURL: process.env.REACT_APP_BACKEND_URL + "/api",
                url: '/rest/images/fetch',
                method: 'POST',
                headers : headers,
                data: data?.body
            })
            return response.data
        } catch (err) {
            return rejectWithValue(err.response.data);
        }
    })
const loadOldImageSlice = createSlice({
    name: "oldImageFetch",
    initialState: {
        list: [],
        continuationToken : "",
        loading: false,
    },
    reducers : {},
    extraReducers: (builder) => {
        builder
            .addCase(loadSingleImage.pending, (state) => {
                state.loading = true;
            })
            .addCase(loadSingleImage.fulfilled, (state, { payload }) => {
                state.list = payload.list;
                state.continuationToken = payload.continuationToken
                state.loading = false;
            })
            .addCase(loadSingleImage.rejected, (state) => {
                state.loading = false;
            })
    },
});
export default loadOldImageSlice.reducer;