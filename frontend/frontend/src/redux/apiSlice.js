import { createSlice } from "@reduxjs/toolkit";
import { apiCallBegan } from "./api";
const apiSlice = createSlice({
    name: "imageFetch",
    initialState: {
        list: [],
        continuationToken : "",
        loading: false,
        filters: [],
        filterField: null,
        totalCount: 0,
        isTruncated: false,
    },
    reducers: {
        imagesRequested: (imageFetch, action) => {
            imageFetch.loading = true;
        },
        imagesReceived: (imageFetch, action) => {
            imageFetch.list = action.payload.list;
            imageFetch.continuationToken = action.payload.continuationToken;
            imageFetch.filters = action.payload.filters || [];
            imageFetch.filterField = action.payload.filterField || null;
            imageFetch.totalCount = action.payload.totalCount || 0;
            imageFetch.isTruncated = action.payload.isTruncated || false;
            imageFetch.loading = false;
        },
        imageRequestFailed: (imageFetch, action) => {
            imageFetch.loading = false;
        },
    },
});
export default apiSlice.reducer;
const { imagesRequested, imagesReceived, imagesRequestFailed } = apiSlice.actions;
export const loadImages = (data) => (dispatch) => {
    return dispatch(
        apiCallBegan({
            url : data?.url,
            method : data?.method,
            body : data?.body,
            headers : data.header,
            onStart: imagesRequested.type,
            onSuccess: imagesReceived.type,
            onError: imagesRequestFailed,
        })
    );
};