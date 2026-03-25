import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
export const DeleteMyImages = createAsyncThunk(
    'images/myImages/delete',
    async (data, { rejectWithValue }) => {
        try {
            let response = await axios.request({
                baseURL: process.env.REACT_APP_BACKEND_URL + "/api",
                url: '/rest/images/myImages/delete',
                method: 'DELETE',
                // config: {
                //     headers: {
                //         "Content-type": "Application/json",
                //         "Access-Control-Allow-Origin": "*",
                //     }
                // },
                headers: data?.headers,
                data: data?.body
            })
            return response.data
        } catch (err) {
            return rejectWithValue(err.response.data);
        }
    })
export const SaveMyImages = createAsyncThunk(
    'images/myImages/save',
    async (data, { rejectWithValue }) => {
        try {
            let response = await axios.request({
                baseURL: process.env.REACT_APP_BACKEND_URL + "/api",
                url: '/rest/images/myImages/save',
                method: "PUT",
                headers: data?.headers,
                data: data?.body
            })
            return response.data
        } catch (err) {
            return rejectWithValue(err.response.data);
        }
    }
)
export const GetMyImages = createAsyncThunk(
    'images/myImages/get',
    async (data, { rejectWithValue }) => {
        try {
            let response = await axios.request({
                baseURL: process.env.REACT_APP_BACKEND_URL + "/api",
                url: '/rest/images/myImages/get',
                method: "GET",
                headers: data?.headers,
                params : data?.body
            })
            return response.data
        } catch (err) {
            return rejectWithValue(err.response.data);
        }
    }
)
export const GetFavImages = createAsyncThunk(
    'images/myImages/getFavourite',
    async (data, { rejectWithValue }) => {
        try {
            let response = await axios.request({
                baseURL: process.env.REACT_APP_BACKEND_URL + "/api",
                url: '/rest/images/myImages/getFavourite',
                method: "GET",
                headers: data?.headers,
                params : data?.body
            })
            return response.data
        } catch (err) {
            return rejectWithValue(err.response.data);
        }
    }
)
export const AddToFavourites = createAsyncThunk(
    'images/myImages/addToFavourite',
    async (data, { rejectWithValue }) => {
        try {
            let response = await axios.request({
                baseURL: process.env.REACT_APP_BACKEND_URL + "/api",
                url: '/rest/images/myImages/addToFavourite',
                method: "PATCH",
                headers: data?.headers,
                data: data?.body
            })
            return response.data
        } catch (err) {
            return rejectWithValue(err.response.data);
        }
    }
)
export const RemoveFromFavourites = createAsyncThunk(
    'images/myImages/removeFromFavourite',
    async (data, { rejectWithValue }) => {
        try {
            let response = await axios.request({
                baseURL: process.env.REACT_APP_BACKEND_URL + "/api",
                url: '/rest/images/myImages/removeFromFavourite',
                method: "PATCH",
                headers: data?.headers,
                data: data?.body
            })
            return response.data
        } catch (err) {
            return rejectWithValue(err.response.data);
        }
    }
)
const AddImagesSlice = createSlice({
    name: "imagesData",
    initialState: {
        images: [],
        hasMore: false,
        msg: null,
        loading: false
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(GetMyImages.fulfilled, (state, { payload }) => {
                state.images = payload.images
                state.hasMore = payload.hasMore
                state.loading = false;
            })
            .addCase(GetMyImages.pending, (state) => {
                state.loading = true;
            })
            .addCase(GetMyImages.rejected, (state) => {
                state.loading = false;
            })
            .addCase(GetFavImages.fulfilled, (state, { payload }) => {
                state.images = payload.images
                state.hasMore = payload.hasMore
                state.loading = false;
            })
            .addCase(GetFavImages.pending, (state) => {
                state.loading = true;
            })
            .addCase(GetFavImages.rejected, (state, { payload }) => {
                state.msg = payload
                state.loading = false;
            })
            .addCase(SaveMyImages.fulfilled, (state, { payload }) => {
                state.msg = payload
                state.loading = false;
            })
            .addCase(SaveMyImages.pending, (state) => {
                state.loading = true;
            })
            .addCase(SaveMyImages.rejected, (state, { payload }) => {
                state.msg = payload
                state.loading = false;
            })
            .addCase(DeleteMyImages.fulfilled, (state, { payload }) => {
                state.msg = payload
                state.loading = false;
            })
            .addCase(DeleteMyImages.pending, (state) => {
                state.loading = true;
            })
            .addCase(DeleteMyImages.rejected, (state, { payload }) => {
                state.msg = payload
                state.loading = false;
            })
    }
});
export default AddImagesSlice.reducer;
