import axios from "axios";

// const BASE_URL = "http://127.0.0.1:8000";
const BASE_URL = "http://192.168.1.17:8000";

export const endpoints = {
    'login': '/o/token/',
    'register': '/users/',
    'current-user': '/users/current-user/',
};

export const authApis = (token) => {
    return axios.create({
        baseURL: BASE_URL,
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
}

export default axios.create({
    baseURL: BASE_URL
});