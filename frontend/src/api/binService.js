import api from './axios';

// Manually create a new bin
export const createBin = (binData) => api.post('/bins', binData);

// Get status/details of a bin by scanning its barcode
export const getBinStatus = (barcode) => api.get(`/bins/barcode/${barcode}`);

// Add bulk items to a location/bin
export const addBulkItems = (bulkData) => api.post('/bins/location', bulkData);