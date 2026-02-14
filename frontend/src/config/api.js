// API Configuration - Uses environment variable for backend URL
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
// Base API URL - maps to /api/rest endpoints
export const API_BASE_URL = `${BACKEND_URL}/api/rest`;
// Export for use in axios requests
export default {
    baseURL: API_BASE_URL,
    backendURL: BACKEND_URL
};
