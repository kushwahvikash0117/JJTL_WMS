import React, { useState } from 'react';
import { getItemByBarcode, getItemByElement, updateItem, entryItem, exitItem } from '../api/itemService';
import { X, Search, Box, Save, LogIn, LogOut, Package } from 'lucide-react';
import { LOCATION_BARCODE_MAP } from '../utils/constants';

const ScanItem = () => {
  const [query, setQuery] = useState('');
  // Set default to 'element'
  const [searchType, setSearchType] = useState('element'); 
  const [item, setItem] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [actionType, setActionType] = useState(null);
  const [inputValue, setInputValue] = useState({});
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query) return;
    setLoading(true);
    try {
      const { data } = searchType === 'rollNo' 
        ? await getItemByBarcode(query) 
        : await getItemByElement(query);
      
      setItem(data);
      setInputValue({ qty: data.qty });
      setShowModal(true);
    } catch (err) { 
      alert("Item not found."); 
    }
    finally { setLoading(false); }
  };

  const handleAction = async () => {
    setLoading(true);
    try {
      if (actionType === 'ENTRY') {
        const scannedInput = inputValue.bin;
        const locationName = Object.keys(LOCATION_BARCODE_MAP).find(
          (key) => LOCATION_BARCODE_MAP[key] === scannedInput
        ) || scannedInput;

        await entryItem({ itemId: item._id, locationBarcode: scannedInput, locationName: locationName });
      } else if (actionType === 'UPDATE') {
        await updateItem(item._id, { qty: inputValue.qty });
      } else if (actionType === 'EXIT') {
        await exitItem({ itemId: item._id, batch: inputValue.batch });
      }
      
      alert("Action successful!");
      setShowModal(false);
      setActionType(null);
      setInputValue({});
    } catch (err) { 
      alert(err.response?.data?.error || "Action failed"); 
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 sm:p-6">
      <h2 className="text-2xl font-extrabold text-gray-900 mb-6">Scan Item</h2>
      
      {/* Search Type Toggle */}
      <div className="flex bg-gray-100 p-1 rounded-xl mb-4">
        <button onClick={() => setSearchType('rollNo')} className={`flex-1 py-2 rounded-lg font-bold text-sm ${searchType === 'rollNo' ? 'bg-white shadow text-cyan-600' : 'text-gray-500'}`}>Roll No</button>
        <button onClick={() => setSearchType('element')} className={`flex-1 py-2 rounded-lg font-bold text-sm ${searchType === 'element' ? 'bg-white shadow text-cyan-600' : 'text-gray-500'}`}>Element</button>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2 mb-8">
        <input className="flex-1 p-4 rounded-2xl border border-gray-200 outline-none focus:border-cyan-500" 
          placeholder={`Scan ${searchType === 'rollNo' ? 'Roll No' : 'Element'}...`} 
          value={query} onChange={(e) => setQuery(e.target.value)} />
        <button className="bg-cyan-600 text-white p-4 rounded-2xl"><Search size={20} /></button>
      </form>

      {showModal && item && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-3xl w-full max-w-sm shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-gray-800 flex items-center gap-2"><Package size={20}/> {item.rollNo}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400"><X size={20}/></button>
            </div>

            {!actionType ? (
              <div className="space-y-3">
                <button onClick={() => setActionType('ENTRY')} className="w-full p-4 bg-emerald-50 text-emerald-700 rounded-2xl font-bold flex justify-between">Entry <LogIn size={20}/></button>
                <button onClick={() => setActionType('UPDATE')} className="w-full p-4 bg-amber-50 text-amber-700 rounded-2xl font-bold flex justify-between">Update <Box size={20}/></button>
                <button onClick={() => setActionType('EXIT')} className="w-full p-4 bg-rose-50 text-rose-700 rounded-2xl font-bold flex justify-between">Exit <LogOut size={20}/></button>
              </div>
            ) : (
              <div className="space-y-3">
                {actionType === 'ENTRY' && <input placeholder="Scan Location Barcode" className="w-full p-3 border rounded-xl" onChange={(e) => setInputValue({bin: e.target.value})} />}
                {actionType === 'UPDATE' && <input type="number" placeholder="New Quantity" className="w-full p-3 border rounded-xl" value={inputValue.qty || ''} onChange={(e) => setInputValue({qty: e.target.value})} />}
                {actionType === 'EXIT' && <input placeholder="Batch ID" className="w-full p-3 border rounded-xl" onChange={(e) => setInputValue({batch: e.target.value})} />}
                
                <div className="flex gap-2 pt-4">
                  <button onClick={() => setActionType(null)} className="flex-1 p-3 bg-gray-100 rounded-xl font-bold">Back</button>
                  <button onClick={handleAction} className="flex-1 p-3 bg-cyan-600 text-white rounded-xl font-bold flex items-center justify-center gap-2">
                    {loading ? '...' : <>Save <Save size={16}/></>}
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