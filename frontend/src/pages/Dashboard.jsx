import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDashboardStats } from '../api/dashboardService';
import { getLogs } from '../api/logService';
import { Package, TrendingUp, AlertTriangle, Users } from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ 
    totalItems: 0, 
    activePO: 0, 
    lowStockAlerts: 0, 
    systemUsers: 0 
  });
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, logsRes] = await Promise.all([
          getDashboardStats(),
          getLogs()
        ]);
        setStats(statsRes.data);
        setLogs(logsRes.data.slice(0, 5));
      } catch (err) {
        console.error('Failed to fetch dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const StatCard = ({ title, value, icon, color }) => (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
      <div className={`p-3 rounded-xl ${color}`}>{icon}</div>
      <div>
        <p className="text-xs text-gray-500 font-medium">{title}</p>
        <h3 className="text-xl font-bold text-gray-800">{value}</h3>
      </div>
    </div>
  );

  return (
    // Removed max-w-7xl and mx-auto to allow full fluid width
    <div className="p-4 sm:p-6 bg-gray-50 min-h-full w-full">
      <h1 className="text-xl font-bold text-gray-800 mb-6">Warehouse Overview</h1>

      {loading ? (
        <p>Loading dashboard...</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Items" value={stats.totalItems} icon={<Package size={20} />} color="bg-blue-50 text-blue-600" />
          <StatCard title="Active P.O." value={stats.activePO} icon={<TrendingUp size={20} />} color="bg-green-50 text-green-600" />
          <StatCard title="Low Stock Alerts" value={stats.lowStockAlerts} icon={<AlertTriangle size={20} />} color="bg-red-50 text-red-600" />
          <StatCard title="System Users" value={stats.systemUsers} icon={<Users size={20} />} color="bg-purple-50 text-purple-600" />
        </div>
      )}

      {/* Recent Activity Section */}
      <div className="mt-6 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-base font-bold text-gray-800">Recent Activity</h2>
          <button onClick={() => navigate('/logs')} className="text-sm text-cyan-600 font-bold hover:underline">
            See All
          </button>
        </div>
        
        {loading ? (
          <p className="text-gray-500 text-sm">Loading activity...</p>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <tbody>
                {logs.map((log) => (
                  <tr key={log._id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="py-3 pr-4 text-sm font-semibold text-gray-900 whitespace-nowrap">{log.performedBy?.name || 'System'}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                        log.action === 'IN' ? 'bg-green-100 text-green-700' :
                        log.action === 'OUT' ? 'bg-red-100 text-red-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">{log.itemId?.barcode || 'N/A'}</td>
                    <td className="py-3 pl-4 text-sm text-right text-gray-400 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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

export default Dashboard;