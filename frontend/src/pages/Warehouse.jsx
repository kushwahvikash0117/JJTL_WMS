import React, { useEffect, useState, useMemo } from 'react';
import { getAllItems } from '../api/itemService';
import { Download, Eye, Filter, Database, X, Search } from 'lucide-react';
import BarcodeCard from '../components/BarcodeCard';
import * as XLSX from 'xlsx';

const Warehouse = () => {
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [filters, setFilters] = useState({});
  const [activeFilterColumn, setActiveFilterColumn] = useState(null);
  const [filterSearch, setFilterSearch] = useState(''); // Local search for filter dropdown

  useEffect(() => { fetchItems(); }, []);

  const fetchItems = async () => {
    try {
      const { data } = await getAllItems();
      setItems(data);
    } catch (err) { console.error(err); }
  };

  const columns = ['buyer', 'poNo', 'rollNo', 'locationName', 'batches', 'qty', 'productDescription'];
  const columnLabels = ['Buyer', 'PO No', 'Roll No', 'Loc', 'Batch', 'Qty', 'Description', 'Actions'];

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
    setFilters(prev => ({ ...prev, [col]: prev[col]?.length === allValues.length ? [] : allValues }));
  };

  const handleExport = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredItems);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Inventory");
    XLSX.writeFile(workbook, "Inventory_Report.xlsx");
  };

  return (
    <div className="p-4 sm:p-8 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2"><Database className="text-cyan-600" /> Inventory</h2>
        <button onClick={handleExport} className="flex items-center gap-2 bg-white px-5 py-2.5 rounded-2xl border border-gray-200 hover:border-cyan-500 hover:text-cyan-600 transition-all font-semibold shadow-sm">
          <Download size={18} /> Export
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-500 uppercase text-[10px] tracking-wider font-bold">
              <tr>
                {columnLabels.map((h, i) => {
                  const colKey = columns[i];
                  return (
                    <th key={h} className="px-6 py-5 relative">
                      <div className="flex items-center gap-1">
                        {h}
                        {colKey && <button onClick={() => { setActiveFilterColumn(activeFilterColumn === colKey ? null : colKey); setFilterSearch(''); }} className="p-1 hover:bg-gray-200 rounded-lg"><Filter size={10} /></button>}
                      </div>
                      {activeFilterColumn === colKey && (
                        <div className="absolute top-16 left-0 bg-white shadow-xl border border-gray-100 rounded-2xl p-3 w-48 z-20 max-h-64 overflow-y-auto">
                          <div className="relative mb-2">
                            <Search className="absolute left-2 top-2 text-gray-400" size={14} />
                            <input autoFocus placeholder="Search..." className="w-full pl-8 pr-2 py-1 text-xs border rounded-lg outline-none" value={filterSearch} onChange={(e) => setFilterSearch(e.target.value)} />
                          </div>
                          <label className="flex items-center gap-2 text-xs font-bold mb-1 p-1 cursor-pointer"><input type="checkbox" checked={filters[colKey]?.length === getUniqueValues(colKey).length && getUniqueValues(colKey).length > 0} onChange={() => toggleSelectAll(colKey)} /> Select All</label>
                          {getUniqueValues(colKey).filter(v => String(v).toLowerCase().includes(filterSearch.toLowerCase())).map(val => (
                            <label key={val} className="flex items-center gap-2 text-xs text-gray-600 py-1 p-1 cursor-pointer hover:bg-gray-50"><input type="checkbox" checked={filters[colKey]?.includes(val)} onChange={() => toggleFilter(colKey, val)} /> {val}</label>
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
                <tr key={item._id} className="hover:bg-cyan-50/30">
                  {columns.map(col => <td key={col} className="px-6 py-4 text-sm text-gray-600">{item[col] || "N/A"}</td>)}
                  <td className="px-6 py-4"><button onClick={() => setSelectedItem(item)} className="text-cyan-600 bg-cyan-50 p-2 rounded-xl"><Eye size={16}/></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedItem && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white p-8 rounded-3xl w-full max-w-lg shadow-2xl">
            <div className="flex justify-between items-center mb-6"><h3 className="font-bold text-lg">Label Preview</h3><button onClick={() => setSelectedItem(null)}><X size={20}/></button></div>
            <BarcodeCard itemData={selectedItem} />
          </div>
        </div>
      )}
    </div>
  );
};

export default Warehouse;