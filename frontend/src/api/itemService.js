import api from './axios';

export const addItem = (itemData) => api.post('/items', itemData);
export const getAllItems = () => api.get('/items');
export const getItemByBarcode = (barcode) => api.get(`/items/${barcode}`);
export const updateItem = (id, itemData) => api.put(`/items/${id}`, itemData);
export const removeItem = (id) => api.delete(`/items/${id}`);