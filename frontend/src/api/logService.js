/**
 * @file logService.js
 * @description Frontend API service functions for retrieving system audit logs and activity histories.
 */

import api from './axios';

/**
 * Fetches all system audit logs.
 * Utilizes the pre-configured Axios instance which automatically appends the base URL and authorization headers.
 * 
 * @returns {Promise<Object>} Axios response object containing system audit logs
 */
export const getLogs = () => {
  return api.get('/logs');
};