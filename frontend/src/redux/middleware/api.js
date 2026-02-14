import axios from "axios";
import * as actions from "../api";
const api =({ dispatch }) => (next) => async (action) => {
        if (action.type !== actions.apiCallBegan.type) return next(action);
        const { url, method, headers, body, onStart, onSuccess, onError } =
            action.payload;
        if (onStart) dispatch({ type: onStart });
        next(action);
        try {
            const response = await axios.request({
                baseURL: "" + process.env.REACT_APP_BACKEND_URL + "/api",
                url,
                method,
                config : {
                    headers : {
                        "Content-type": "Application/json",
                        "Access-Control-Allow-Origin" : "*",
                    }
                },
                data : body
            });
            // General
            dispatch(actions.apiCallSucess(response.data));
            // Specific
            if (onSuccess)
                dispatch({ type: onSuccess, payload: response.data });
        } catch (error) {
            // General
            dispatch(actions.apiCallFailed(error.message));
            // return response.status(400).send(error);
            // Error handled
            // Specific
            if (onError) dispatch({ type: onError, payload: error.message });
        }
    };
export default api;