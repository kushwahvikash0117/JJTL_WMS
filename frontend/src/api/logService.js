import axios from 'axios';

const API_URL = 'http://localhost:5005/api/logs';

// Helper to get headers with the auth token
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };
};

// Fetch all logs
export const getLogs = async () => {
  return await axios.get(API_URL, getAuthHeaders());
};