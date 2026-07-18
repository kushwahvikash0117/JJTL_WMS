import React, { useState } from 'react';
import { getItemByBarcode, updateItem, removeItem } from '../api/itemService';
import { Edit2, Trash2, X, Search, Package, Box, ChevronRight } from 'lucide-react';

const ScanItem = () => {
  const [barcode, setBarcode] = useState('');
  const [item, setItem] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [newQty, setNewQty] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!barcode.trim()) return;
    
    setLoading(true);
    try {
      const { data } = await getItemByBarcode(barcode);
      setItem(data);
      setNewQty(data.qty);
      setShowModal(true);
    } catch (err) {
      alert("Item not found in database.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    try {
      await updateItem(item._id, { qty: newQty });
      alert("Quantity updated successfully!");
      setShowModal(false);
      setIsEditing(false);
    } catch (err) { alert("Update failed"); }
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to remove this item?")) {
      try {
        await removeItem(item._id);
        alert("Item removed successfully");
        setShowModal(false);
      } catch (err) { alert("Failed to remove item"); }
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 sm:p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-extrabold text-gray-900">Scan & Lookup</h2>
        <p className="text-gray-500 text-sm">Enter barcode to manage inventory details.</p>
      </div>
      
      <form onSubmit={handleSearch} className="bg-white p-2 rounded-2xl shadow-sm border border-gray-100 flex items-center">
        <input 
          type="text" 
          value={barcode}
          onChange={(e) => setBarcode(e.target.value)}
          className="flex-1 p-3 bg-transparent outline-none text-gray-700"
          placeholder="Enter or scan barcode..."
        />
        <button type="submit" className="bg-cyan-600 text-white p-3 rounded-xl hover:bg-cyan-700 transition">
          {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Search size={20} />}
        </button>
      </form>

      {showModal && item && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white p-8 rounded-3xl w-full max-w-md shadow-2xl border border-gray-100 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold flex items-center gap-2 text-cyan-600">
                <Box size={20} /> Inventory Details
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
            </div>

            {isEditing ? (
              <div className="space-y-4">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Update Quantity</label>
                <input 
                  type="number" 
                  value={newQty} 
                  onChange={(e) => setNewQty(e.target.value)}
                  className="w-full border-2 border-gray-100 p-4 rounded-2xl outline-none focus:border-cyan-500 font-bold text-lg" 
                />
                <button onClick={handleUpdate} className="w-full bg-cyan-600 text-white py-4 rounded-2xl font-bold hover:bg-cyan-700 transition">Save Changes</button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Barcode', val: item.barcode },
                    { label: 'Qty', val: item.qty },
                    { label: 'Location', val: item.location },
                    { label: 'Grade', val: item.grade },
                    { label: 'Net Wt', val: item.netWeight },
                    { label: 'Color', val: item.color }
                  ].map((field, i) => (
                    <div key={i} className="bg-gray-50 p-3 rounded-xl">
                      <p className="text-[10px] uppercase font-bold text-gray-400">{field.label}</p>
                      <p className="font-semibold text-gray-800">{field.val}</p>
                    </div>
                  ))}
                  <div className="col-span-2 bg-gray-50 p-3 rounded-xl">
                     <p className="text-[10px] uppercase font-bold text-gray-400">Description</p>
                     <p className="font-semibold text-gray-800 text-sm">{item.productDescription}</p>
                  </div>
                </div>
                
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setIsEditing(true)} className="flex-1 flex items-center justify-center gap-2 py-3 bg-cyan-50 text-cyan-700 rounded-2xl font-bold hover:bg-cyan-100 transition">
                    <Edit2 size={16}/> Edit
                  </button>
                  <button onClick={handleDelete} className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-50 text-red-600 rounded-2xl font-bold hover:bg-red-100 transition">
                    <Trash2 size={16}/> Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ScanItem;