import React, { useEffect, useState, useMemo } from 'react';
import { getAllItems, removeItem, updateItem } from '../api/itemService';
import { Trash2, Eye, Edit2, X, Download, Filter } from 'lucide-react';
import BarcodeCard from '../components/BarcodeCard';
import * as XLSX from 'xlsx';

const Warehouse = () => {
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [viewMode, setViewMode] = useState(null);
  const [qty, setQty] = useState('');
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => { fetchItems(); }, []);

  const fetchItems = async () => {
    try {
      const { data } = await getAllItems();
      setItems(data);
    } catch (err) { console.error(err); }
  };

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch = 
        item.poNo?.toLowerCase().includes(search.toLowerCase()) ||
        item.barcode?.toLowerCase().includes(search.toLowerCase()) ||
        item.customer?.toLowerCase().includes(search.toLowerCase());
      const matchesType = filterType === 'all' || item.productDescription?.toLowerCase().includes(filterType.toLowerCase());
      return matchesSearch && matchesType;
    });
  }, [items, search, filterType]);

  const handleExport = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredItems);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Inventory");
    XLSX.writeFile(workbook, "Inventory_Report.xlsx");
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure?')) {
      await removeItem(id);
      fetchItems();
    }
  };

  const handleUpdate = async () => {
    await updateItem(selectedItem._id, { ...selectedItem, qty });
    setSelectedItem(null);
    fetchItems();
  };

  return (
    // Changed to w-full and h-full to avoid overflow conflict with parent layout
    <div className="p-4 sm:p-8 bg-gray-50 w-full h-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="text-2xl sm:text-3xl font-bold">Inventory</h2>
        <button 
          onClick={handleExport} 
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 w-full sm:w-auto justify-center"
        >
          <Download size={18} /> Export
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6 flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2 flex-1 border rounded-lg px-3 py-2 bg-gray-50">
          <Filter size={18} className="text-gray-400" />
          <input 
            type="text" 
            placeholder="Search..." 
            className="w-full bg-transparent outline-none"
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select 
          className="border p-2 rounded-lg bg-gray-50 outline-none w-full sm:w-auto" 
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="all">All Types</option>
          {[...new Set(items.map(i => i.productDescription))].filter(Boolean).map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map((item) => (
          <div key={item._id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition">
            <h3 className="font-bold text-lg truncate">{item.barcode}</h3>
            <p className="text-sm text-gray-500 truncate">PO: {item.poNo} | Cust: {item.customer}</p>
            <div className="mt-4 flex gap-2">
              <button onClick={() => { setSelectedItem(item); setViewMode('view'); }} className="flex-1 bg-blue-50 py-2 rounded-lg text-blue-600 flex justify-center"><Eye size={18} /></button>
              <button onClick={() => { setSelectedItem(item); setQty(item.qty); setViewMode('update'); }} className="flex-1 bg-yellow-50 py-2 rounded-lg text-yellow-600 flex justify-center"><Edit2 size={18} /></button>
              <button onClick={() => handleDelete(item._id)} className="flex-1 bg-red-50 py-2 rounded-lg text-red-600 flex justify-center"><Trash2 size={18} /></button>
            </div>
          </div>
        ))}
      </div>

      {selectedItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 z-[60]">
          <div className="bg-white p-6 rounded-t-3xl sm:rounded-3xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-4 sticky top-0 bg-white">
              <h2 className="text-lg font-bold">{viewMode === 'update' ? 'Update Quantity' : 'Details'}</h2>
              <button onClick={() => setSelectedItem(null)} className="p-2 hover:bg-gray-100 rounded-full"><X size={20}/></button>
            </div>
            
            <div className="space-y-3 text-sm pb-4">
              {Object.entries(selectedItem).map(([k, v]) => {
                if (['_id', '__v', 'createdBy', 'updatedBy'].includes(k)) return null;
                return <p key={k}><strong className="capitalize">{k.replace(/([A-Z])/g, ' $1')}:</strong> {v}</p>;
              })}
            </div>

            {viewMode === 'update' && (
              <div className="mt-2 border-t pt-4">
                <label className="block font-bold mb-2">New Quantity</label>
                <input type="number" value={qty} onChange={(e) => setQty(e.target.value)} className="w-full border-2 p-3 rounded-xl outline-none focus:border-cyan-500" />
                <button onClick={handleUpdate} className="w-full mt-4 bg-yellow-500 text-white py-3 rounded-xl font-bold">Confirm Update</button>
              </div>
            )}
            <div className="mt-4"><BarcodeCard itemData={selectedItem} /></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Warehouse;