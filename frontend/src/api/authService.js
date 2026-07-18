import api from './axios';

export const sendOTP = (email) => api.post('/auth/send-otp', { email });
export const verifyOTP = (email, otp) => api.post('/auth/verify-otp', { email, otp });
export const register = (userData) => api.post('/auth/register', userData);
export const login = (credentials) => api.post('/auth/login', credentials);
export const resetPassword = (credentials) => api.post('/auth/reset-password', credentials);
