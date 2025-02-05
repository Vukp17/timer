import axios, { AxiosError, AxiosResponse } from 'axios';
import Router from 'next/router'; // Assuming you're using Next.js for routing

const API_URL = process.env.API_URL || "http://localhost:4000";

interface ApiResponse<T> {
    status: 'success' | 'error';
    message: string;
    data?: T;
    errors?: any[];
}

const api = axios.create({
    baseURL: API_URL, // Adjust based on your API URL
    headers: { 'Content-Type': 'application/json' },
});

// Interceptor to normalize responses
api.interceptors.response.use(
    (response: AxiosResponse<ApiResponse<any>>) => {
        console.log('API response:', response.data);
        if (response.data.status === 'success') {
            return response.data.data; // Only return data
        }
        return Promise.reject(response.data); // Forward errors
    },
    (error: AxiosError) => {
        console.error('API error:', error);
        Router.push('/login'); // Redirect to login page

        const responseData = error.response?.data as ApiResponse<any>;
        if (responseData?.status === 'error' && responseData?.message === 'Unauthorized') {
            Router.push('/login'); // Redirect to login page
        }
        return Promise.reject(responseData || { status: 'error', message: 'Unknown error' });
    }
);

export default api;
