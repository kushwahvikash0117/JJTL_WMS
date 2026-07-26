/**
 * @file binService.js
 * @description Frontend API service functions for bin creation, scanning, and bulk item management.
 */

import api from './axios';

/**
 * Creates a new bin within the warehouse.
 * 
 * @param {Object} binData - Data containing bin location and specifications
 * @returns {Promise<Object>} Axios response object
 */
export const createBin = (binData) => api.post('/bins', binData);

/**
 * Retrieves the status and details of a bin by scanning its barcode.
 * 
 * @param {string} barcode - The barcode identifier of the bin
 * @returns {Promise<Object>} Axios response object
 */
export const getBinStatus = (barcode) => api.get(`/bins/barcode/${barcode}`);

/**
 * Adds multiple items in bulk to a designated location or bin.
 * 
 * @param {Object} bulkData - Object containing bulk items and target location details
 * @returns {Promise<Object>} Axios response object
 */
export const addBulkItems = (bulkData) => api.post('/bins/location', bulkData);