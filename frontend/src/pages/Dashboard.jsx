import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDashboardStats } from '../api/dashboardService';
import { getLogs } from '../api/logService';
import { Package, TrendingUp, AlertTriangle, Users, ArrowRight, LayoutDashboard } from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ totalItems: 0, activePO: 0, lowStockAlerts: 0, systemUsers: 0 });
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, logsRes] = await Promise.all([getDashboardStats(), getLogs()]);
        setStats(statsRes.data);
        setLogs(logsRes.data.slice(0, 5));
      } catch (err) { console.error('Failed to fetch dashboard data', err); }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const StatCard = ({ title, value, icon, color, bgColor }) => (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-5 hover:shadow-md transition-all duration-300">
      <div className={`p-4 rounded-2xl ${bgColor} ${color}`}>{icon}</div>
      <div>
        <p className="text-sm text-gray-400 font-medium">{title}</p>
        <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
      </div>
    </div>
  );

  return (
    <div className="p-4 sm:p-8 bg-gray-50 min-h-screen">
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-cyan-600 p-2 rounded-xl text-white"><LayoutDashboard size={24}/></div>
        <h1 className="text-2xl font-bold text-gray-800">Warehouse Overview</h1>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
          {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-white rounded-3xl shadow-sm" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Total Items" value={stats.totalItems} icon={<Package size={24} />} color="text-blue-600" bgColor="bg-blue-50" />
          <StatCard title="Active P.O." value={stats.activePO} icon={<TrendingUp size={24} />} color="text-green-600" bgColor="bg-green-50" />
          <StatCard title="Low Stock" value={stats.lowStockAlerts} icon={<AlertTriangle size={24} />} color="text-red-600" bgColor="bg-red-50" />
          <StatCard title="Users" value={stats.systemUsers} icon={<Users size={24} />} color="text-purple-600" bgColor="bg-purple-50" />
        </div>
      )}

      <div className="mt-8 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-gray-800">Recent Activity</h2>
          <button onClick={() => navigate('/logs')} className="flex items-center gap-2 text-sm text-cyan-600 font-semibold hover:gap-3 transition-all">
            View History <ArrowRight size={16} />
          </button>
        </div>
        
        <div className="space-y-4">
          {logs.map((log) => (
            <div key={log._id} className="flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl hover:bg-cyan-50/30 transition-colors">
              <div className="flex items-center gap-4">
                <div className={`w-2 h-2 rounded-full ${log.action === 'IN' ? 'bg-green-500' : 'bg-red-500'}`} />
                <div>
                  <p className="text-sm font-bold text-gray-800">{log.performedBy?.name || 'System'}</p>
                  <p className="text-xs text-gray-500 font-mono">{log.itemId?.barcode || 'N/A'}</p>
                </div>
              </div>
              <div className="text-right">
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                  log.action === 'IN' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {log.action}
                </span>
                <p className="text-[10px] text-gray-400 mt-1">
                  {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;