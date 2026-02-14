import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
export const SearchImages = createAsyncThunk(
    'search/global',
    async (data, { rejectWithValue }) => {
        try {
            let response = await axios.request({
                baseURL: process.env.REACT_APP_BACKEND_URL + "/api",
                url: '/rest/search/global',
                method: "GET",
                headers: {"Content-Type": "application/json"},
                params : data?.body
            })
            // Normalize response - API returns 'results', convert to 'data' for compatibility
            const apiResponse = response.data;
            return {
                data: apiResponse.results || [],
                total: apiResponse.total || 0,
                query: apiResponse.query,
                hasMore: (apiResponse.results?.length || 0) < (apiResponse.total || 0)
            };
        } catch (err) {
            return rejectWithValue(err.response?.data || { message: 'Search failed' });
        }
    }
);
const fetchSearchSlice = createSlice({
    name: "searchedImage",
    initialState: {
        searchedImages: [],
        hasMore: false,
        pagination : 0,
        msg: null,
        loading: false,
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(SearchImages.fulfilled, (state, { payload }) => {
                state.images = payload
                state.searchedImages = payload.data || []
                state.pagination = payload.total > 0 ? Math.ceil(payload.total / (payload.data?.length || 1)) : 0
                state.hasMore = payload.hasMore
                state.loading = false;
            })
            .addCase(SearchImages.pending, (state) => {
                state.loading = true;
            })
            .addCase(SearchImages.rejected, (state) => {
                state.loading = false;
            })
    }
})
export default fetchSearchSlice.reducer;