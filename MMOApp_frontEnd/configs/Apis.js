import axios from "axios";

const BASE_URL = "http://127.0.0.1:8000";
// const BASE_URL = "http://192.168.1.23:8000";

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
    'create-store': '/stores/',
    'update-store': (storeId) => `/stores/${storeId}/`,
    'get-products': "/products/",
    "my-products": "/products/my-products/",
    "create-product": "/products/",
    "update-product": (productId) => `/products/${productId}/`,
    "delete-product": (productId) => `/products/${productId}/`,
    "get-blogs": '/blogs/',
    "create-blog": '/blogs/',
    "update-blog": (blogId) => `/blogs/${blogId}/`,
    "delete-blog": (blogId) => `/blogs/${blogId}/`,
    "my-blogs": 'blogs/my-blogs/',
    "upload-image": '/upload-image/',
    "get-blog-comments": (blogId) => `/blog-comments/${blogId}/get-blog-comments/`,
    "add-comment": (blogId) => `/blog-comments/${blogId}/post-comments/`,
    "delete-comment": (blogId) => `/blog-comments/${blogId}/`,
    "get-like": (blogId) => `/blog-likes/${blogId}/like-count/`,
    "add-like": (blogId) => `/blog-likes/${blogId}/like/`,
    "my-vouchers": '/vouchers/my-vouchers/',
    "add-voucher": '/vouchers/',
    "updateVoucher": (voucherId) => `/vouchers/${voucherId}/`,
    "deleteVoucher": (voucherId) => `/vouchers/${voucherId}/`,
    "check-voucher": '/vouchers/check/',
    "get-stocks": (productId) => `/account-stocks/${productId}/product-stocks/`,
    "add-stocks": (productId) => `/account-stocks/${productId}/create-stock/`,
    "delete-stocks": (stockId) => `/account-stocks/${stockId}/`,
    "update-stocks": (stockId) => `/account-stocks/${stockId}/`,
    "add-order": '/orders/',
    "my-order": '/orders/my-orders/',
    "store-order": '/orders/store-orders/',
    "add-acc-order-detail": '/acc-orders-detail/',
    "add-service-order-detail": '/service-orders-detail/',
    "get-order-detail": orderId => `/orders/${orderId}/details/`,
    "update-order": (orderId) => `/orders/${orderId}/`,
    "update-service-order-detail": (serviceId) => `/service-orders-detail/${serviceId}/`,
    "store-stat": '/order-stats/', 
    

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