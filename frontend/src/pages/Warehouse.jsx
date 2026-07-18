import React, { useEffect, useState, useMemo } from 'react';
import { getAllItems, removeItem } from '../api/itemService';
import { Trash2, X, Download, Eye, Filter, Database, LayoutGrid } from 'lucide-react';
import BarcodeCard from '../components/BarcodeCard';
import * as XLSX from 'xlsx';

const Warehouse = () => {
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [filters, setFilters] = useState({});
  const [activeFilterColumn, setActiveFilterColumn] = useState(null);

  useEffect(() => { fetchItems(); }, []);

  const fetchItems = async () => {
    try {
      const { data } = await getAllItems();
      setItems(data);
    } catch (err) { console.error(err); }
  };

  const columns = ['barcode', 'buyer', 'poNo', 'rollNo', 'location', 'qty', 'netWeight'];
  const columnLabels = ['Barcode', 'Buyer', 'PO No', 'Roll No', 'Loc', 'Qty', 'Net Wt', 'Actions'];

  const getUniqueValues = (column) => [...new Set(items.map(item => item[column]))].filter(Boolean);

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      return Object.entries(filters).every(([col, selectedValues]) => {
        if (!selectedValues || selectedValues.length === 0) return true;
        return selectedValues.includes(item[col]);
      });
    });
  }, [items, filters]);

  const toggleFilter = (col, value) => {
    setFilters(prev => {
      const current = prev[col] || [];
      const updated = current.includes(value) ? current.filter(v => v !== value) : [...current, value];
      return { ...prev, [col]: updated };
    });
  };

  const toggleSelectAll = (col) => {
    const allValues = getUniqueValues(col);
    setFilters(prev => ({
      ...prev,
      [col]: prev[col]?.length === allValues.length ? [] : allValues
    }));
  };

  const handleExport = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredItems);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Inventory");
    XLSX.writeFile(workbook, "Inventory_Report.xlsx");
  };

  return (
    <div className="p-4 sm:p-8 bg-gray-50 min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
            <Database className="text-cyan-600" /> Inventory
          </h2>
          <p className="text-gray-500 text-sm mt-1">Manage and filter your warehouse stock.</p>
        </div>
        <button onClick={handleExport} className="flex items-center gap-2 bg-white text-gray-700 px-5 py-2.5 rounded-2xl border border-gray-200 hover:border-cyan-500 hover:text-cyan-600 transition-all font-semibold shadow-sm">
          <Download size={18} /> Export Excel
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50/50 text-gray-500 uppercase text-[10px] tracking-wider font-bold">
              <tr>
                {columnLabels.map((h, i) => {
                  const colKey = columns[i];
                  return (
                    <th key={h} className="px-6 py-5 relative group">
                      <div className="flex items-center gap-2">
                        {h}
                        {colKey && (
                          <button 
                            onClick={() => setActiveFilterColumn(activeFilterColumn === colKey ? null : colKey)}
                            className={`p-1 rounded-lg transition-colors ${filters[colKey]?.length > 0 ? 'bg-cyan-100 text-cyan-600' : 'hover:bg-gray-200 text-gray-400'}`}
                          >
                            <Filter size={12} />
                          </button>
                        )}
                      </div>
                      {activeFilterColumn === colKey && (
                        <div className="absolute top-16 left-0 bg-white shadow-2xl border border-gray-100 rounded-2xl p-3 w-48 z-20 max-h-64 overflow-y-auto">
                          <label className="flex items-center gap-3 px-2 py-2 cursor-pointer hover:bg-gray-50 rounded-lg font-bold text-gray-800 border-b border-gray-100 mb-2">
                            <input type="checkbox" className="accent-cyan-600" checked={filters[colKey]?.length === getUniqueValues(colKey).length && getUniqueValues(colKey).length > 0} onChange={() => toggleSelectAll(colKey)} />
                            (Select All)
                          </label>
                          {getUniqueValues(colKey).map(val => (
                            <label key={val} className="flex items-center gap-3 px-2 py-2 cursor-pointer hover:bg-gray-50 rounded-lg text-gray-600 font-medium">
                              <input type="checkbox" className="accent-cyan-600" checked={filters[colKey]?.includes(val)} onChange={() => toggleFilter(colKey, val)} />
                              {val}
                            </label>
                          ))}
                        </div>
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredItems.map((item) => (
                <tr key={item._id} className="hover:bg-cyan-50/30 transition-colors">
                  <td className="px-6 py-4 font-bold text-gray-900">{item.barcode}</td>
                  <td className="px-6 py-4 text-gray-600">{item.buyer}</td>
                  <td className="px-6 py-4 text-gray-600">{item.poNo}</td>
                  <td className="px-6 py-4 text-gray-600">{item.rollNo}</td>
                  <td className="px-6 py-4 text-gray-600">{item.location}</td>
                  <td className="px-6 py-4 font-semibold text-gray-800">{item.qty}</td>
                  <td className="px-6 py-4 text-gray-600">{item.netWeight}</td>
                  <td className="px-6 py-4 flex gap-2">
                    <button onClick={() => setSelectedItem(item)} className="text-cyan-600 bg-cyan-50 p-2 rounded-xl hover:bg-cyan-100"><Eye size={16}/></button>
                    <button onClick={() => removeItem(item._id).then(fetchItems)} className="text-red-500 bg-red-50 p-2 rounded-xl hover:bg-red-100"><Trash2 size={16}/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedItem && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white p-8 rounded-3xl w-full max-w-lg shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-lg text-gray-800">Label Preview</h3>
              <button onClick={() => setSelectedItem(null)} className="p-2 hover:bg-gray-100 rounded-full"><X size={20}/></button>
            </div>
            <div className="bg-gray-100 p-4 rounded-2xl border border-gray-200">
              <BarcodeCard itemData={selectedItem} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Warehouse;