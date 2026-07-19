import api from './axios';

// Add new item
export const addItem = (itemData) => api.post('/items', itemData);

// Get all items (for Warehouse view)
export const getAllItems = () => api.get('/items');

// Get item by Roll No (Barcode)
export const getItemByBarcode = (barcode) => api.get(`/items/barcode/${barcode}`);


export const getItemByElement = (element) => api.get(`/items/element/${element}`);

// Link item to a bin
export const entryItem = (payload) => api.post('/items/entry', payload);

// Update Qty and Batch
export const updateItem = (id, itemData) => api.put(`/items/${id}`, itemData);

// Exit/De-link item from bin
export const exitItem = (payload) => api.post('/items/exit', payload);

// Note: If you still need the direct delete function for administrative purposes,
// you can keep this, but standard workflow should now use exitItem.
export const removeItem = (id) => api.delete(`/items/${id}`);