import React, { useEffect, useState } from 'react';
import { getLogs } from '../api/logService';

const Logs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

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

  return (
    // Added 'w-full' to ensure the main container occupies the available width
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen w-full">
      <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6">System Activity Logs</h2>

      {/* Added 'max-w-full' to prevent the card from growing beyond the viewport */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden max-w-full">
        {loading ? (
          <div className="p-10 text-center">Loading logs...</div>
        ) : (
          /* Added block wrapper with auto-scroll for the table */
          <div className="block w-full overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-200">
                  <th className="px-3 py-3 sm:px-5 text-[10px] sm:text-xs font-semibold text-gray-600 uppercase">User</th>
                  <th className="px-3 py-3 sm:px-5 text-[10px] sm:text-xs font-semibold text-gray-600 uppercase">Action</th>
                  <th className="px-3 py-3 sm:px-5 text-[10px] sm:text-xs font-semibold text-gray-600 uppercase">Barcode</th>
                  <th className="px-3 py-3 sm:px-5 text-[10px] sm:text-xs font-semibold text-gray-600 uppercase">Remarks</th>
                  <th className="px-3 py-3 sm:px-5 text-[10px] sm:text-xs font-semibold text-gray-600 uppercase">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log._id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-3 py-4 sm:px-5 text-xs font-semibold text-gray-900">{log.performedBy?.name || 'System'}</td>
                    <td className="px-3 py-4 sm:px-5 text-sm">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                        log.action === 'IN' ? 'bg-green-100 text-green-700' :
                        log.action === 'OUT' ? 'bg-red-100 text-red-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-3 py-4 sm:px-5 text-xs text-gray-700">{log.itemId?.barcode || 'N/A'}</td>
                    <td className="px-3 py-4 sm:px-5 text-xs text-gray-600 max-w-[100px] truncate">{log.remarks || '-'}</td>
                    <td className="px-3 py-4 sm:px-5 text-[10px] text-gray-500">
                      {new Date(log.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Logs;