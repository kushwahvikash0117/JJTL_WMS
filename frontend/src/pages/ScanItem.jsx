import React, { useState } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { getItemByBarcode, updateItem } from '../api/itemService';
import { Edit2, Eye, X, Save } from 'lucide-react';

const ScanItem = () => {
  const [item, setItem] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [newQty, setNewQty] = useState(0);

  const handleScan = async (result) => {
    if (!result || !result[0]?.rawValue) return;
    const barcode = result[0].rawValue;
    
    // Simple debounce/check to prevent multiple rapid scans
    if (showModal) return; 

    try {
      const { data } = await getItemByBarcode(barcode);
      setItem(data);
      setNewQty(data.qty);
      setShowModal(true);
    } catch (err) {
      console.error("Item not found", err);
      alert("Item not found in database.");
    }
  };

  const handleUpdate = async () => {
    try {
      await updateItem(item._id, { qty: newQty });
      alert("Quantity updated successfully!");
      setShowModal(false);
      setIsEditing(false);
    } catch (err) {
      alert("Update failed");
    }
  };

  return (
    <div className="max-w-lg mx-auto p-4 sm:p-6">
      <h2 className="text-xl sm:text-2xl font-bold mb-4 text-gray-800">Camera Scanner</h2>
      
      {/* Scanner View - Responsive height */}
      <div className="rounded-2xl overflow-hidden border-4 border-white shadow-2xl aspect-square sm:aspect-video w-full">
        <Scanner 
          onScan={handleScan} 
          constraints={{ facingMode: 'environment' }} 
        />
      </div>

      <p className="mt-4 text-center text-sm text-gray-500">Position the barcode within the frame</p>

      {/* Action Modal */}
      {showModal && item && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-t-3xl sm:rounded-3xl w-full max-w-sm shadow-2xl animate-in slide-in-from-bottom-10">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold truncate">Barcode: {item.barcode}</h3>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded-full"><X size={20}/></button>
            </div>

            {isEditing ? (
              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-600">Update Quantity</label>
                <input 
                  type="number" 
                  value={newQty} 
                  onChange={(e) => setNewQty(e.target.value)}
                  className="w-full border-2 border-gray-200 p-3 rounded-xl focus:border-cyan-500 outline-none text-lg" 
                />
                <button onClick={handleUpdate} className="w-full bg-cyan-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2">
                  <Save size={18}/> Save Changes
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-xl space-y-2">
                  <p className="text-sm text-gray-600"><strong>Customer:</strong> {item.customer}</p>
                  <p className="text-sm text-gray-600"><strong>Current Qty:</strong> {item.qty}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <button className="flex items-center justify-center gap-2 p-3 bg-gray-100 rounded-xl font-medium text-sm">
                    <Eye size={16}/> View
                  </button>
                  <button onClick={() => setIsEditing(true)} className="flex items-center justify-center gap-2 p-3 bg-cyan-50 text-cyan-700 rounded-xl font-medium text-sm">
                    <Edit2 size={16}/> Update
                  </button>
                  <button onClick={() => setShowModal(false)} className="col-span-2 p-3 bg-red-50 text-red-600 rounded-xl font-bold text-sm mt-2">
                    Exit
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