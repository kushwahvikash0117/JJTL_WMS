import api from './axios';

/**
 * Fetches the overview statistics for the Warehouse dashboard.
 * This will return data like total items, rack usage, etc.
 */
export const getDashboardStats = () => {
  return api.get('/dashboard/stats');
};