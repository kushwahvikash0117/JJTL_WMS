/**
 * @file Logs.jsx
 * @description React component rendering system logs and operation history for the JJTL WMS Enterprise Suite.
 */

import React, { useEffect, useState, useMemo } from 'react';
import { getLogs } from '../api/logService';
import { getItemByBarcode } from '../api/itemService';
import { Search, History, X, Info, User, Package, Calendar, FileText } from 'lucide-react';

/**
 * Logs Component
 * 
 * @returns {JSX.Element} The rendered Logs component
 */
const Logs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);
  
  const [detailedItem, setDetailedItem] = useState(null);
  const [fetchingItem, setFetchingItem] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    if (selectedLog && selectedLog.itemId) {
      const identifier = typeof selectedLog.itemId === 'object' 
        ? (selectedLog.itemId.rollNo || selectedLog.itemId._id) 
        : selectedLog.itemId;

      if (identifier) {
        fetchExtraItemDetails(identifier);
      }
    } else {
      setDetailedItem(null);
    }
  }, [selectedLog]);

  /**
   * Helper function to format numbers up to 2 decimal places if they are decimals.
   * 
   * @param {any} val - Value to format
   * @returns {string|any} Formatted value
   */
  const formatNumber = (val) => {
    if (typeof val === 'number' || (!isNaN(val) && val !== '' && val !== null && val !== undefined)) {
      const num = Number(val);
      return Number.isInteger(num) ? num : num.toFixed(2);
    }
    return val;
  };

  /**
   * Fetches all activity logs from the backend API.
   */
  const fetchLogs = async () => {
    try {
      const response = await getLogs();
      setLogs(response.data);
    } catch (err) {
      console.error('Failed to fetch logs', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetches extra item details using the item identifier or barcode.
   * 
   * @param {string} identifier - Item roll number, ID, or barcode
   */
  const fetchExtraItemDetails = async (identifier) => {
    setFetchingItem(true);
    try {
      const response = await getItemByBarcode(identifier);
      setDetailedItem(response.data);
    } catch (err) {
      console.error('Could not fetch extra item details from itemService', err);
      setDetailedItem(null);
    } finally {
      setFetchingItem(false);
    }
  };

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => 
      log.performedBy?.name?.toLowerCase().includes(search.toLowerCase()) ||
      log.action?.toLowerCase().includes(search.toLowerCase()) ||
      log.itemId?.element?.toLowerCase().includes(search.toLowerCase()) ||
      log.itemId?.poNo?.toLowerCase().includes(search.toLowerCase()) ||
      log.itemId?.buyer?.toLowerCase().includes(search.toLowerCase())
    );
  }, [logs, search]);

  /**
   * Determines the Tailwind CSS badge styling based on action type.
   * 
   * @param {string} action - Action name (e.g., ADD, ALLOCATE, EXIT)
   * @returns {string} CSS class string
   */
  const getActionBadge = (action) => {
    switch (action) {
      case 'ADD':
      case 'IN':
        return 'bg-emerald-50 text-emerald-600 border border-emerald-100';
      case 'ALLOCATE':
        return 'bg-amber-50 text-amber-600 border border-amber-100';
      case 'UPDATE':
        return 'bg-sky-50 text-sky-600 border border-sky-100';
      case 'EXIT':
      case 'OUT':
        return 'bg-rose-50 text-rose-600 border border-rose-100';
      default:
        return 'bg-gray-50 text-gray-600 border border-gray-100';
    }
  };

  return (
    <div className="p-4 sm:p-8 bg-gray-50 min-h-screen relative">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900 flex items-center gap-2">
            <History className="text-cyan-600" /> System Logs & Operation History
          </h2>
          <p className="text-gray-500 mt-1">Track all inventory additions, allocations, updates, and exits. Click any row for details.</p>
        </div>
        
        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-3 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by element, buyer, user..." 
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-cyan-500 outline-none transition-all bg-white"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-20 text-center text-gray-400">Loading activity...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50/70 text-gray-500 uppercase text-[11px] tracking-wider border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Action</th>
                  <th className="px-6 py-4">Element</th>
                  <th className="px-6 py-4">PO No</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Location</th>
                  <th className="px-6 py-4">Qty</th>
                  <th className="px-6 py-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-sm">
                {filteredLogs.length > 0 ? (
                  filteredLogs.map((log) => (
                    <tr 
                      key={log._id} 
                      onClick={() => setSelectedLog(log)}
                      className="hover:bg-cyan-50/30 transition-colors duration-200 cursor-pointer group"
                    >
                      <td className="px-6 py-4 font-semibold text-gray-800 flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-cyan-100 text-cyan-700 flex items-center justify-center text-xs font-bold">
                          {log.performedBy?.name ? log.performedBy.name.charAt(0).toUpperCase() : 'S'}
                        </div>
                        {log.performedBy?.name || 'System'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${getActionBadge(log.action)}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold text-gray-900 group-hover:text-cyan-700 transition-colors">
                        {log.itemId?.element || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-gray-600 font-medium">{log.itemId?.poNo || '-'}</td>
                      <td className="px-6 py-4 text-gray-600">{log.itemId?.buyer || '-'}</td>
                      <td className="px-6 py-4 text-gray-600">
                        <span className="bg-gray-100 px-2.5 py-1 rounded-md text-xs font-medium">
                          {log.itemId?.locationName || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-700">
                        {log.itemId?.qty !== undefined && log.itemId?.qty !== null ? formatNumber(log.itemId.qty) : '-'}
                      </td>
                      <td className="px-6 py-4 text-gray-400 text-xs">
                        {new Date(log.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="p-12 text-center text-gray-400">No logs found matching your search criteria.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Simplified Operation Popup Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]">
            
            {/* Modal Header */}
            <div className="px-5 py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-cyan-100 text-cyan-700">
                  <Info size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Log Details</h3>
                  <p className="text-[11px] text-gray-500">ID: {selectedLog._id}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedLog(null)}
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200/50 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-sm">
              
              {/* Basic Info Row */}
              <div className="grid grid-cols-2 gap-3 bg-gray-50 p-3.5 rounded-xl border border-gray-100">
                <div>
                  <span className="text-[11px] text-gray-400 font-medium flex items-center gap-1 mb-0.5">
                    <User size={13} /> User
                  </span>
                  <p className="font-bold text-gray-800 text-xs">{selectedLog.performedBy?.name || 'System'}</p>
                </div>
                <div>
                  <span className="text-[11px] text-gray-400 font-medium flex items-center gap-1 mb-0.5">
                    <Package size={13} /> Action
                  </span>
                  <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${getActionBadge(selectedLog.action)}`}>
                    {selectedLog.action}
                  </span>
                </div>
                <div className="col-span-2 pt-1 border-t border-gray-200/60">
                  <span className="text-[11px] text-gray-400 font-medium flex items-center gap-1 mb-0.5">
                    <Calendar size={13} /> Timestamp
                  </span>
                  <p className="font-semibold text-gray-700 text-xs">
                    {new Date(selectedLog.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                </div>
              </div>

              {/* Clean Item Summary List */}
              <div className="border border-gray-100 rounded-xl p-4 bg-white space-y-2.5">
                <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                  <span className="text-xs text-gray-400 font-medium">Element</span>
                  <span className="font-bold text-gray-900 text-xs">{detailedItem?.element || selectedLog.itemId?.element || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                  <span className="text-xs text-gray-400 font-medium">PO No</span>
                  <span className="font-semibold text-gray-700 text-xs">{detailedItem?.poNo || selectedLog.itemId?.poNo || '-'}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                  <span className="text-xs text-gray-400 font-medium">Customer (Buyer)</span>
                  <span className="font-semibold text-gray-700 text-xs">{detailedItem?.buyer || selectedLog.itemId?.buyer || '-'}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                  <span className="text-xs text-gray-400 font-medium">Location</span>
                  <span className="font-semibold text-gray-700 text-xs">{detailedItem?.locationName || selectedLog.itemId?.locationName || '-'}</span>
                </div>
                
                {/* 1. Initial Quantity (First point) */}
                <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                  <span className="text-xs text-gray-400 font-medium">Initial Quantity</span>
                  <span className="font-extrabold text-cyan-600 text-xs">
                    {formatNumber(
                      detailedItem?.initialQuantity ?? 
                      detailedItem?.qty ?? 
                      selectedLog.itemId?.initialQuantity ?? 
                      selectedLog.itemId?.qty ?? 
                      '-'
                    )} Kg
                  </span>
                </div>

                {/* 2. Current Quantity when exited (Last point) */}
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400 font-medium">Current Quantity (Exited)</span>
                  <span className="font-extrabold text-rose-600 text-xs">
                    {formatNumber(
                      detailedItem?.currentQuantity ?? 
                      detailedItem?.qty ?? 
                      selectedLog.itemId?.currentQuantity ?? 
                      selectedLog.itemId?.qty ?? 
                      '-'
                    )} Kg
                  </span>
                </div>
              </div>

              {/* Remarks (If any) */}
              {selectedLog.remarks && (
                <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-3">
                  <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wide flex items-center gap-1 mb-1">
                    <FileText size={13} /> Remarks
                  </span>
                  <p className="text-gray-700 text-xs italic">{selectedLog.remarks}</p>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button 
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 rounded-xl bg-gray-900 text-white font-semibold text-xs hover:bg-gray-850 transition-colors"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default Logs;