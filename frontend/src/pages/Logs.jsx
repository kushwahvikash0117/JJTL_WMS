import React, { useEffect, useState, useMemo } from 'react';
import { getLogs } from '../api/logService';
import { Search, History } from 'lucide-react';

const Logs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

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

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => 
      log.performedBy?.name?.toLowerCase().includes(search.toLowerCase()) ||
      log.action?.toLowerCase().includes(search.toLowerCase()) ||
      log.itemId?.rollNo?.toLowerCase().includes(search.toLowerCase())
    );
  }, [logs, search]);

  return (
    <div className="p-4 sm:p-8 bg-gray-50 min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900 flex items-center gap-2">
            <History className="text-cyan-600" /> System Logs
          </h2>
          <p className="text-gray-500 mt-1">Track all inventory movements and actions.</p>
        </div>
        
        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-3 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search logs..." 
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-cyan-500 outline-none transition-all"
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
            <table className="w-full text-left">
              <thead className="bg-gray-50/50 text-gray-500 uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="px-6 py-5">User</th>
                  <th className="px-6 py-5">Action</th>
                  <th className="px-6 py-5">Roll No</th>
                  <th className="px-6 py-5">Remarks</th>
                  <th className="px-6 py-5">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredLogs.length > 0 ? (
                  filteredLogs.map((log) => (
                    <tr key={log._id} className="hover:bg-cyan-50/30 transition-colors duration-200">
                      <td className="px-6 py-5 font-semibold text-gray-800">{log.performedBy?.name || 'System'}</td>
                      <td className="px-6 py-5">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                          log.action === 'IN' ? 'bg-emerald-50 text-emerald-600' :
                          log.action === 'OUT' ? 'bg-rose-50 text-rose-600' :
                          'bg-sky-50 text-sky-600'
                        }`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-5 font-bold text-cyan-700">
                        {log.itemId?.rollNo || 'N/A'}
                      </td>
                      <td className="px-6 py-5 text-gray-500 text-sm italic">{log.remarks || '-'}</td>
                      <td className="px-6 py-5 text-gray-400 text-xs">
                        {new Date(log.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="p-10 text-center text-gray-400">No logs found matching your search.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Logs;