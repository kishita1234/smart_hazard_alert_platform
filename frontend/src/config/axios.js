import axios from "axios";
const axiosClient = axios.create();
axiosClient.defaults.baseURL = "http://127.0.0.1:8000";

export default axiosClient;