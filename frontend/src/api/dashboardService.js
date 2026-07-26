/**
 * @file dashboardService.js
 * @description Frontend API service functions for retrieving warehouse overview statistics and analytics data.
 */

import api from './axios';

/**
 * Fetches overview statistics for the Warehouse dashboard.
 * Returns aggregated metrics such as total items, rack usage, and inventory counts.
 * 
 * @returns {Promise<Object>} Axios response object containing dashboard statistics
 */
export const getDashboardStats = () => {
  return api.get('/dashboard/stats');
};