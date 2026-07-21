import api from './axios';

/**
 * Fetches all system logs.
 * The 'api' instance handles the baseURL and the authorization headers
 * (if you have configured an interceptor in your axios.js file).
 */
export const getLogs = () => {
  return api.get('/logs');
};