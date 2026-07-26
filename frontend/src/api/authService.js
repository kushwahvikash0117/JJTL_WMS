/**
 * @file authService.js
 * @description Frontend API service functions for user authentication and authorization endpoints.
 */

import api from './axios';

/**
 * Sends a One-Time Password (OTP) to the specified email address.
 * 
 * @param {string} email - The user's email address
 * @returns {Promise<Object>} Axios response object
 */
export const sendOTP = (email) => api.post('/auth/send-otp', { email });

/**
 * Verifies the OTP sent to the user's email address.
 * 
 * @param {string} email - The user's email address
 * @param {string} otp - The OTP code received
 * @returns {Promise<Object>} Axios response object
 */
export const verifyOTP = (email, otp) => api.post('/auth/verify-otp', { email, otp });

/**
 * Registers a new user in the system.
 * 
 * @param {Object} userData - Object containing user registration details (name, email, password)
 * @returns {Promise<Object>} Axios response object
 */
export const register = (userData) => api.post('/auth/register', userData);

/**
 * Authenticates an existing user and returns a JWT token.
 * 
 * @param {Object} credentials - Object containing login credentials (email, password)
 * @returns {Promise<Object>} Axios response object
 */
export const login = (credentials) => api.post('/auth/login', credentials);

/**
 * Resets a user's password using a verified token or OTP session.
 * 
 * @param {Object} credentials - Object containing new password details and verification identifiers
 * @returns {Promise<Object>} Axios response object
 */
export const resetPassword = (credentials) => api.post('/auth/reset-password', credentials);