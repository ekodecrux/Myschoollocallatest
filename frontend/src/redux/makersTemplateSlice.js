import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
export const MakersTemplate = createAsyncThunk(
    'makers/templates',
    async (data, { rejectWithValue }) => {
        try {
            let headers = data.headers
            let payload = {}
            let res =""
            let response = ""
            let images = ""
            let folderPath = ""
            if (data.type !== "images") {
                response = await axios.request({
                    baseURL: process.env.REACT_APP_BACKEND_URL + "/api",
                    url: '/rest/images/fetch',
                    method: 'POST',
                    headers: headers,
                    data: {
                        "folderPath": "PRINT RICH/makersTemplate/Maker Templates PNG/",
                        "continuationToken": null,
                        "imagesPerPage": 100
                    }
                })
            } else {
                if (data.path === 'worksheet-maker') {
                    folderPath = "SECTIONS DATA/VISUAL WORKSHEET"
                } else if (data.path === 'chart-maker') {
                    folderPath = "SECTIONS DATA/PROJECT CHARTS/"
                }
                images = await axios.request({
                    baseURL: process.env.REACT_APP_BACKEND_URL + "/api",
                    url: '/rest/images/fetch',
                    method: 'POST',
                    headers: headers,
                    data: {
                        "folderPath": folderPath,
                        "continuationToken": data.continuationToken,
                        "imagesPerPage": 10
                    }
                })
            }       
            payload = { template: res?.data, thumb: response?.data, images : images?.data }
            return payload
        } catch (err) {
            return rejectWithValue(err.response.data);
        }
    })
const makersTemplateSlice = createSlice({
    name: "makersTemplate",
    initialState: {
        loading: false,
        templatesData: []
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(MakersTemplate.fulfilled, (state, { payload }) => {
                state.templatesData = payload
                state.loading = false;
            })
            .addCase(MakersTemplate.pending, (state) => {
                state.loading = true
            })
            .addCase(MakersTemplate.rejected, (state, { payload }) => {
                state.templatesData = payload
                state.loading = false;
            })
    }
});
export default makersTemplateSlice.reducer;
