/**
 * @file itemService.js
 * @description Frontend API service functions for managing inventory items, barcode scanning, entries, and exits.
 */

import api from './axios';

/**
 * Adds a new item to the inventory.
 * 
 * @param {Object} itemData - Data object containing the details of the item to be added
 * @returns {Promise<Object>} Axios response object
 */
export const addItem = (itemData) => api.post('/items', itemData);

/**
 * Retrieves all items currently registered in the warehouse inventory.
 * 
 * @returns {Promise<Object>} Axios response object containing the list of items
 */
export const getAllItems = () => api.get('/items');

/**
 * Retrieves a specific item by scanning or searching its barcode (Roll No).
 * 
 * @param {string} barcode - The barcode identifier of the item
 * @returns {Promise<Object>} Axios response object containing item details
 */
export const getItemByBarcode = (barcode) => api.get(`/items/barcode/${barcode}`);

/**
 * Retrieves items matching a specific structural or categorical element.
 * 
 * @param {string} element - The element identifier to filter by
 * @returns {Promise<Object>} Axios response object containing matching items
 */
export const getItemByElement = (element) => api.get(`/items/element/${element}`);

/**
 * Links an inventory item to a storage bin or location (Entry operation).
 * 
 * @param {Object} payload - Object containing item and target bin/location mapping identifiers
 * @returns {Promise<Object>} Axios response object
 */
export const entryItem = (payload) => api.post('/items/entry', payload);

/**
 * Updates an existing item's quantity, batch, or general properties.
 * 
 * @param {string} id - The unique MongoDB identifier of the item
 * @param {Object} itemData - Updated properties for the item
 * @returns {Promise<Object>} Axios response object
 */
export const updateItem = (id, itemData) => api.put(`/items/${id}`, itemData);

/**
 * Processes an item exit or de-links it from its current storage bin.
 * 
 * @param {Object} payload - Object detailing the exit specifications and quantities
 * @returns {Promise<Object>} Axios response object
 */
export const exitItem = (payload) => api.post('/items/exit', payload);

/**
 * Processes a batch exit for multiple items under a single batch number.
 * 
 * @param {Object} payload - Object containing itemIds array and the batchNo string
 * @returns {Promise<Object>} Axios response object
 */
export const batchExitItems = (payload) => api.post('/items/batch-exit', payload);