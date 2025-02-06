import axios, { AxiosError, AxiosResponse } from 'axios';
import Router from 'next/router';

const API_URL = process.env.API_URL || "http://localhost:4000";

interface ApiResponse<T> {
    status: 'success' | 'error';
    message: string;
    data?: T;
    errors?: any[];
}

// Create an axios instance without Authorization header initially
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request Interceptor to add token dynamically
api.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token'); // Only access localStorage on client-side
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});

// Response Interceptor
api.interceptors.response.use(
    (response: AxiosResponse<ApiResponse<any>>) => {
        if (response.data.status === 'success') {
            return response.data.data; // Only return data
        }
        return Promise.reject(response.data); // Forward errors
    },
    (error: AxiosError) => {
        console.error('API error:', error);
        const responseData = error.response?.data as ApiResponse<any>;

        if (responseData?.status === 'error' && responseData?.message === 'Unauthorized') {
            if (typeof window !== 'undefined') {
                localStorage.removeItem('token'); // Remove invalid token
                Router.push('/login'); // Redirect to login page
            }
        }
        return Promise.reject(responseData || { status: 'error', message: 'Unknown error' });
    }
);

export default api;
