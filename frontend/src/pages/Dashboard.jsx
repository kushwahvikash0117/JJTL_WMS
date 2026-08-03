/**
 * @file Dashboard.jsx
 * @description React component rendering the warehouse overview analytics dashboard with Chart.js statistics and metrics.
 */

import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDashboardStats } from '../api/dashboardService';
import { getLogs } from '../api/logService';
import { getAllItems } from '../api/itemService';
import { Package, Clock, CheckCircle2, Scale, LayoutDashboard, BarChart2, PieChart } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

/**
 * Dashboard Component
 * 
 * @returns {JSX.Element} The rendered Dashboard component
 */
const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ totalItems: 0, activePO: 0, lowStockAlerts: 0, systemUsers: 0 });
  const [logs, setLogs] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, logsRes, itemsRes] = await Promise.all([
          getDashboardStats(), 
          getLogs(),
          getAllItems()
        ]);
        setStats(statsRes.data);
        setLogs(logsRes.data);
        // Handle items response structure gracefully (array or nested response.data)
        const itemsData = Array.isArray(itemsRes) ? itemsRes : (itemsRes.data || itemsRes.items || []);
        setItems(itemsData);
      } catch (err) { 
        console.error('Failed to fetch dashboard data', err); 
      } finally { 
        setLoading(false); 
      }
    };
    fetchData();
  }, []);

  /**
   * Normalizes action names into four core categories: Allocate, Add, Exit, Update.
   * 
   * @param {string} rawAction - The raw action string from the log
   * @returns {string|null} Normalized action name or null
   */
  const normalizeAction = (rawAction) => {
    const action = (rawAction || '').toUpperCase();
    if (action === 'ADD' || action === 'IN') return 'Add';
    if (action === 'EXIT' || action === 'OUT') return 'Exit';
    if (action === 'ALLOCATE') return 'Allocate';
    if (action === 'UPDATE') return 'Update';
    return null;
  };

  // Calculate dynamic values for the 4 updated stat fields
  const customStats = useMemo(() => {
    const totalItems = stats.totalItems || 0;
    
    // Upcoming Items: count of items from getAllItems that have no location and no batch assigned
    const upcomingItemsCount = items.filter((item) => {
      if (!item) return false;
      
      const hasNoLocation = (!item.locationName || String(item.locationName).trim() === '') && 
                            (!item.locationBarcode || String(item.locationBarcode).trim() === '') &&
                            (!item.locationId || String(item.locationId).trim() === '');
                            
      const hasNoBatch = (!item.batches || String(item.batches).trim() === '') && 
                         (!item.batchNo || String(item.batchNo).trim() === '');

      return hasNoLocation && hasNoBatch;
    }).length;

    // Items Issued Today (Count of 'Exit' or 'OUT' logs created today)
    const todayStr = new Date().toDateString();
    const issuedToday = logs.filter((log) => {
      const isExit = (log.action || '').toUpperCase() === 'EXIT' || (log.action || '').toUpperCase() === 'OUT';
      const isToday = log.createdAt && new Date(log.createdAt).toDateString() === todayStr;
      return isExit && isToday;
    }).length;

    // Total KGs of items: sum of quantities where location is NOT null and batch IS null
    let totalKgs = 0;
    logs.forEach((log) => {
      const item = log.itemId;
      if (!item) return;

      const hasNotNullLocation = Boolean((item.locationName && String(item.locationName).trim() !== '') || 
                                         (item.locationBarcode && String(item.locationBarcode).trim() !== '') || 
                                         item.locationId);
      const hasNullBatch = (!item.batches || String(item.batches).trim() === '') && 
                           (!item.batchNo || String(item.batchNo).trim() === '');

      if (hasNotNullLocation && hasNullBatch) {
        const currentQuantity = item.currentQuantity !== undefined && item.currentQuantity !== null ? item.currentQuantity : item.qty;
        if (currentQuantity !== undefined && currentQuantity !== null && typeof Number(currentQuantity) === 'number' && !isNaN(Number(currentQuantity))) {
          totalKgs += Number(currentQuantity);
        }
      }
    });

    return {
      totalItems,
      upcomingItems: upcomingItemsCount,
      issuedToday,
      totalKgs: `${totalKgs.toLocaleString()} KG`,
    };
  }, [stats, logs, items]);

  // Process data for Buyer Bar Chart (All Buyers with a location assigned) with horizontal scrolling container if many buyers exist
  const buyerChartData = useMemo(() => {
    const buyerCounts = {};
    logs.forEach((log) => {
      const item = log.itemId;
      if (!item) return;

      // Current stock criteria: Location assigned (not null/empty)
      const hasNotNullLocation = Boolean(
        (item.locationName && String(item.locationName).trim() !== '') || 
        (item.locationBarcode && String(item.locationBarcode).trim() !== '') || 
        item.locationId
      );

      if (hasNotNullLocation) {
        const buyer = item.buyer;
        if (buyer && buyer !== '-') {
          buyerCounts[buyer] = (buyerCounts[buyer] || 0) + 1;
        }
      }
    });

    // Sort all buyers by count descending (without slice(0, 5) to include all)
    const sortedBuyers = Object.entries(buyerCounts)
      .sort((a, b) => b[1] - a[1]);

    return {
      labels: sortedBuyers.map(([buyer]) => buyer),
      datasets: [
        {
          label: 'Current Stock Logs by Buyer',
          data: sortedBuyers.map(([, count]) => count),
          backgroundColor: 'rgba(8, 145, 178, 0.8)',
          borderRadius: 8,
        },
      ],
    };
  }, [logs]);

  // Process data for Action Type Doughnut Chart (Only Allocate, Add, Exit, Update)
  const actionChartData = useMemo(() => {
    const actionCounts = { Allocate: 0, Add: 0, Exit: 0, Update: 0 };
    
    logs.forEach((log) => {
      const normalized = normalizeAction(log.action);
      if (normalized && actionCounts[normalized] !== undefined) {
        actionCounts[normalized] += 1;
      }
    });

    return {
      labels: Object.keys(actionCounts),
      datasets: [
        {
          data: Object.values(actionCounts),
          backgroundColor: [
            '#F59E0B', // Amber (Allocate)
            '#10B981', // Emerald (Add)
            '#EF4444', // Rose (Exit)
            '#0EA5E9', // Sky (Update)
          ],
          borderWidth: 0,
        },
      ],
    };
  }, [logs]);

  // Process data for Timeline Line Chart showing ALL dates with horizontal scroll container
  const timelineChartData = useMemo(() => {
    const dateCounts = {};
    logs.forEach((log) => {
      if (!log.createdAt) return;
      const dateStr = new Date(log.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: '2-digit' });
      dateCounts[dateStr] = (dateCounts[dateStr] || 0) + 1;
    });

    const sortedDates = Object.entries(dateCounts).sort((a, b) => new Date(a[0]) - new Date(b[0]));

    return {
      labels: sortedDates.map(([date]) => date),
      datasets: [
        {
          label: 'Activity Trend',
          data: sortedDates.map(([, count]) => count),
          borderColor: '#0891B2',
          backgroundColor: 'rgba(8, 145, 178, 0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 4,
        },
      ],
    };
  }, [logs]);

  /**
   * Reusable Stat Card component.
   * 
   * @param {Object} props - Card properties
   * @returns {JSX.Element} Stat card element
   */
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
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-cyan-600 p-2 rounded-xl text-white"><LayoutDashboard size={24}/></div>
        <h1 className="text-2xl font-bold text-gray-800">Warehouse Overview & Analytics</h1>
      </div>

      {/* Top Stat Cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
          {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-white rounded-3xl shadow-sm" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Total Items" value={customStats.totalItems} icon={<Package size={24} />} color="text-blue-600" bgColor="bg-blue-50" />
          <StatCard title="Upcoming Items" value={customStats.upcomingItems} icon={<Clock size={24} />} color="text-amber-600" bgColor="bg-amber-50" />
          <StatCard title="Items Issued Today" value={customStats.issuedToday} icon={<CheckCircle2 size={24} />} color="text-emerald-600" bgColor="bg-emerald-50" />
          <StatCard title="Total KGs of Items" value={customStats.totalKgs} icon={<Scale size={24} />} color="text-purple-600" bgColor="bg-purple-50" />
        </div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        
        {/* Bar Graph: Buyer Count Distribution (Current Stock with Location Only, Scrollable for all buyers) */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 lg:col-span-2 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
                <BarChart2 size={18} className="text-cyan-600" /> Buyers (Current Stock - Location Assigned)
              </h2>
              <p className="text-xs text-gray-400">Scroll horizontally to view all buyers</p>
            </div>
          </div>
          <div className="w-full overflow-x-auto pb-2">
            <div className="min-w-[600px] h-72 flex items-center justify-center">
              {loading ? (
                <span className="text-gray-400 text-sm animate-pulse">Loading chart data...</span>
              ) : (
                <Bar 
                  data={buyerChartData} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                      y: { grid: { color: '#F3F4F6' }, ticks: { precision: 0 } },
                      x: { grid: { display: false } }
                    }
                  }} 
                />
              )}
            </div>
          </div>
        </div>

        {/* Doughnut Chart: Actions Breakdown (Allocate, Add, Exit, Update) */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-between">
          <div className="mb-4">
            <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
              <PieChart size={18} className="text-cyan-600" /> Operation Types
            </h2>
            <p className="text-xs text-gray-400">Allocate, Add, Exit, Update</p>
          </div>
          <div className="h-64 flex items-center justify-center">
            {loading ? (
              <span className="text-gray-400 text-sm animate-pulse">Loading chart...</span>
            ) : (
              <Doughnut 
                data={actionChartData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } }
                  }
                }} 
              />
            )}
          </div>
        </div>

        {/* Line Chart: Activity Trend Over All Dates with Horizontal Scroll */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 lg:col-span-3 flex flex-col justify-between">
          <div className="mb-4">
            <h2 className="text-base font-bold text-gray-800">Activity Trend</h2>
            <p className="text-xs text-gray-400">Scroll horizontally to view complete timeline history</p>
          </div>
          <div className="w-full overflow-x-auto pb-2">
            <div className="min-w-[800px] h-64 flex items-center justify-center">
              {loading ? (
                <span className="text-gray-400 text-sm animate-pulse">Loading trend...</span>
              ) : (
                <Line 
                  data={timelineChartData} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                      y: { grid: { color: '#F3F4F6' }, ticks: { precision: 0 } },
                      x: { grid: { display: false } }
                    }
                  }} 
                />
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;