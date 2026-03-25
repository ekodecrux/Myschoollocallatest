import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
export const FetchKPIs = createAsyncThunk(
    'search/global',
    async (data, { rejectWithValue }) => {
        try {
            let response = await axios.request({
                baseURL: process.env.REACT_APP_BACKEND_URL + "/api",
                url: '/rest/search/global',
                method: "GET",
                headers: data?.headers,
                params : data?.body
            })
            return response.data
        } catch (err) {
            return rejectWithValue(err.response.data);
        }
    }
);
const fetchAnalyticsSlice = createSlice({
    name: "analytics",
    initialState: {
        data: null,
        loading: false
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(FetchKPIs.fulfilled, (state, { payload }) => {
                state.data = payload
                state.loading = false;
            })
            .addCase(FetchKPIs.pending, (state) => {
                state.loading = true;
            })
            .addCase(FetchKPIs.rejected, (state) => {
                state.loading = false;
            })
    }
})
export default fetchAnalyticsSlice.reducer;