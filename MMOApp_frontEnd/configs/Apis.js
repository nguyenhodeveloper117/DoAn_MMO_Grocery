import axios from "axios";

// const BASE_URL = "http://127.0.0.1:8000";
const BASE_URL = "http://192.168.1.17:8000";

export const endpoints = {
    'login': '/o/token/',
    'register': '/users/',
    'current-user': '/users/current-user/',
    'update-user': (userId) => `/users/${userId}/`,
    'get-verification': 'verifications/my-verification/',
    'update-verification': (verificationCode) => `/verifications/${verificationCode}/`,
    'create-verification': 'verifications/',
    'become-seller': 'users/upgrade-to-seller/',
    'my-store': '/stores/my-store/',
    'create-stores': '/stores/',
    'update-store': (storeId) => `/stores/${storeId}/`

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