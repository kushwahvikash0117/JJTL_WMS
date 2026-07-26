/**
 * @file ScanItem.jsx
 * @description React component for scanning and managing inventory items and bulk warehouse bin locations in the JJTL WMS system.
 */

import React, { useState } from 'react';
import { getItemByBarcode, getItemByElement, updateItem, entryItem, exitItem } from '../api/itemService';
import { addBulkItems } from '../api/binService';
import { X, Search, Box, Save, LogIn, LogOut, Package, MapPin, Plus } from 'lucide-react';
import { LOCATION_BARCODE_MAP } from '../utils/constants';

/**
 * ScanItem Component
 * 
 * @returns {JSX.Element} The rendered ScanItem component
 */
const ScanItem = () => {
  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState('bulkEntry'); 
  const [item, setItem] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [actionType, setActionType] = useState(null);
  const [inputValue, setInputValue] = useState({});
  const [loading, setLoading] = useState(false);

  // States specific to Bulk Location Scanner Mode
  const [bulkStep, setBulkStep] = useState('scanLocation');
  const [resolvedBin, setResolvedBin] = useState({ barcode: '', name: '' });
  const [scannedIdentifiers, setScannedIdentifiers] = useState([]);
  const [currentItemCode, setCurrentItemCode] = useState('');
  const [bulkScanMode, setBulkScanMode] = useState('element');

  /**
   * Handles search and location barcode resolution on form submission.
   * 
   * @param {React.FormEvent} e - Form event
   */
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query) return;

    if (searchType === 'bulkEntry') {
      const scannedInput = String(query).trim();
      const locationName = Object.entries(LOCATION_BARCODE_MAP).find(
        ([name, barcode]) => String(barcode).trim() === scannedInput
      )?.[0] || scannedInput;

      setResolvedBin({ barcode: scannedInput, name: locationName });
      setBulkStep('scanItems');
      setScannedIdentifiers([]);
      setCurrentItemCode('');
      setBulkScanMode('element');
      setShowModal(true);
      setQuery('');
      return;
    }

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
    } finally { 
      setLoading(false); 
    }
  };

  /**
   * Executes inventory actions (ENTRY, UPDATE, EXIT) for individual items.
   */
  const handleAction = async () => {
    setLoading(true);
    try {
      if (actionType === 'ENTRY') {
        const scannedInput = String(inputValue.bin).trim();
        
        // Validate if location barcode exists in LOCATION_BARCODE_MAP
        const matchedLocation = Object.entries(LOCATION_BARCODE_MAP).find(
          ([name, barcode]) => String(barcode).trim() === scannedInput
        );

        if (!matchedLocation) {
          alert("Location barcode invalid");
          setLoading(false);
          setInputValue({ ...inputValue, bin: '' }); // Reset bin input to prompt scanning again
          return;
        }

        const locationName = matchedLocation[0];

        await entryItem({ itemId: item._id, locationBarcode: scannedInput, locationName: locationName });
      } else if (actionType === 'UPDATE') {
        await updateItem(item._id, { 
          qty: inputValue.qty, 
          batchNo: inputValue.batchNo 
        });
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

  /**
   * Adds the current scanned item identifier to the bulk queue after checking for duplicates.
   */
  const handleScanNextItem = () => {
    const trimmedCode = currentItemCode.trim();
    if (!trimmedCode) return;

    if (scannedIdentifiers.includes(trimmedCode)) {
      alert("This item is already added to the scan queue.");
      setCurrentItemCode('');
      return;
    }

    setScannedIdentifiers((prev) => [...prev, trimmedCode]);
    setCurrentItemCode('');
  };

  /**
   * Saves all scanned items in the bulk queue to the specified bin location.
   */
  const handleSaveAllBulk = async () => {
    if (scannedIdentifiers.length === 0) {
      alert("Please scan at least one item.");
      return;
    }
    setLoading(true);
    try {
      await addBulkItems({
        locationBarcode: resolvedBin.barcode,
        locationName: resolvedBin.name,
        itemIdentifiers: scannedIdentifiers
      });
      alert("Bulk items mapped successfully!");
      setShowModal(false);
      setScannedIdentifiers([]);
      setResolvedBin({ barcode: '', name: '' });
      setBulkStep('scanLocation');
    } catch (err) {
      alert(err.response?.data?.error || "Bulk assignment failed");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Closes the active modal and resets all related state values.
   */
  const handleCloseModal = () => {
    setShowModal(false);
    setActionType(null);
    setInputValue({});
    setBulkStep('scanLocation');
    setScannedIdentifiers([]);
    setCurrentItemCode('');
  };

  return (
    <div className="max-w-md mx-auto p-4 sm:p-6">
      <h2 className="text-2xl font-extrabold text-gray-900 mb-6">Scan Item</h2>
      
      <div className="grid grid-cols-3 gap-1 bg-gray-100 p-1 rounded-xl mb-4">
        <button onClick={() => setSearchType('rollNo')} className={`py-2 rounded-lg font-bold text-xs sm:text-sm ${searchType === 'rollNo' ? 'bg-white shadow text-cyan-600' : 'text-gray-500'}`}>Roll No</button>
        <button onClick={() => setSearchType('element')} className={`py-2 rounded-lg font-bold text-xs sm:text-sm ${searchType === 'element' ? 'bg-white shadow text-cyan-600' : 'text-gray-500'}`}>Element</button>
        <button onClick={() => setSearchType('bulkEntry')} className={`py-2 rounded-lg font-bold text-xs sm:text-sm ${searchType === 'bulkEntry' ? 'bg-white shadow text-cyan-600' : 'text-gray-500'}`}>Bulk Location</button>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2 mb-8">
        <input className="flex-1 p-4 rounded-2xl border border-gray-200 outline-none focus:border-cyan-500" 
          placeholder={searchType === 'bulkEntry' ? 'Scan Location Barcode...' : `Scan ${searchType === 'rollNo' ? 'Roll No' : 'Element'}...`} 
          value={query} onChange={(e) => setQuery(e.target.value)} />
        <button className="bg-cyan-600 text-white p-4 rounded-2xl"><Search size={20} /></button>
      </form>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-3xl w-full max-w-sm shadow-2xl max-h-[90vh] overflow-y-auto">
            
            {searchType === 'bulkEntry' ? (
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <MapPin size={20} className="text-cyan-600"/> {resolvedBin.name}
                  </h3>
                  <button onClick={handleCloseModal} className="text-gray-400"><X size={20}/></button>
                </div>

                <p className="text-xs text-gray-500 mb-3">Location Barcode: <span className="font-mono font-semibold text-gray-700">{resolvedBin.barcode}</span></p>

                <div className="flex bg-gray-100 p-1 rounded-xl mb-3">
                  <button 
                    type="button" 
                    onClick={() => setBulkScanMode('element')} 
                    className={`flex-1 py-1.5 rounded-lg font-bold text-xs ${bulkScanMode === 'element' ? 'bg-white shadow text-cyan-600' : 'text-gray-500'}`}>
                    Scan by Element
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setBulkScanMode('rollNo')} 
                    className={`flex-1 py-1.5 rounded-lg font-bold text-xs ${bulkScanMode === 'rollNo' ? 'bg-white shadow text-cyan-600' : 'text-gray-500'}`}>
                    Scan by Roll No
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-gray-600 block mb-1">
                      Scan {bulkScanMode === 'element' ? 'Element' : 'Roll No'}
                    </label>
                    <input 
                      placeholder={`Scan ${bulkScanMode}...`} 
                      className="w-full p-3 border rounded-xl outline-none focus:border-cyan-500 font-mono text-sm"
                      value={currentItemCode}
                      onChange={(e) => setCurrentItemCode(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleScanNextItem(); }}}
                    />
                  </div>

                  <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100 max-h-36 overflow-y-auto">
                    <div className="text-xs font-bold text-gray-500 mb-2 flex justify-between">
                      <span>Scanned Queue</span>
                      <span className="bg-cyan-100 text-cyan-800 px-2 py-0.5 rounded-full">{scannedIdentifiers.length} items</span>
                    </div>
                    {scannedIdentifiers.length === 0 ? (
                      <p className="text-xs text-gray-400 italic text-center py-2">No items added yet</p>
                    ) : (
                      <ul className="space-y-1">
                        {scannedIdentifiers.map((code, idx) => (
                          <li key={idx} className="text-xs bg-white px-2 py-1.5 rounded border border-gray-200 font-mono flex justify-between items-center">
                            <span>{code}</span>
                            <span className="text-gray-400">#{idx + 1}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button onClick={handleCloseModal} className="flex-1 p-3 bg-gray-100 rounded-xl font-bold text-sm text-gray-600">Back</button>
                    <button onClick={handleScanNextItem} className="flex-1 p-3 bg-amber-50 text-amber-700 rounded-xl font-bold text-sm flex items-center justify-center gap-1">
                      Scan Next <Plus size={16}/>
                    </button>
                  </div>
                  
                  <button 
                    onClick={handleSaveAllBulk} 
                    disabled={loading || scannedIdentifiers.length === 0}
                    className="w-full p-3 bg-cyan-600 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                    {loading ? 'Processing...' : <>Save All <Save size={16}/></>}
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-gray-800 flex items-center gap-2"><Package size={20}/> {item?.rollNo}</h3>
                  <button onClick={handleCloseModal} className="text-gray-400"><X size={20}/></button>
                </div>

                {!actionType ? (
                  <div className="space-y-3">
                    <button onClick={() => setActionType('ENTRY')} className="w-full p-4 bg-emerald-50 text-emerald-700 rounded-2xl font-bold flex justify-between items-center">Entry <LogIn size={20}/></button>
                    <button onClick={() => setActionType('UPDATE')} className="w-full p-4 bg-amber-50 text-amber-700 rounded-2xl font-bold flex justify-between items-center">Update <Box size={20}/></button>
                    <button onClick={() => setActionType('EXIT')} className="w-full p-4 bg-rose-50 text-rose-700 rounded-2xl font-bold flex justify-between items-center">Exit <LogOut size={20}/></button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {actionType === 'ENTRY' && (
                      <input 
                        placeholder="Scan Location Barcode" 
                        className="w-full p-3 border rounded-xl outline-none focus:border-cyan-500 text-sm" 
                        value={inputValue.bin || ''}
                        onChange={(e) => setInputValue({bin: e.target.value})} 
                      />
                    )}
                    
                    {actionType === 'UPDATE' && (
                      <div className="space-y-2.5">
                        <div className="bg-cyan-50 p-2.5 rounded-xl border border-cyan-100 text-xs text-cyan-800 mb-1">
                          Current Quantity: <span className="font-bold">{item?.qty || 0}</span>
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-gray-500 block mb-1">New Total Quantity</label>
                          <input type="number" placeholder="New Quantity" className="w-full p-3 border rounded-xl outline-none focus:border-cyan-500 text-sm" value={inputValue.qty || ''} onChange={(e) => setInputValue({...inputValue, qty: e.target.value})} />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-gray-500 block mb-1">Batch Number</label>
                          <input placeholder="Batch No" className="w-full p-3 border rounded-xl outline-none focus:border-cyan-500 text-sm" value={inputValue.batchNo || ''} onChange={(e) => setInputValue({...inputValue, batchNo: e.target.value})} />
                        </div>
                      </div>
                    )}

                    {actionType === 'EXIT' && (
                      <input placeholder="Batch ID" className="w-full p-3 border rounded-xl outline-none focus:border-cyan-500 text-sm" onChange={(e) => setInputValue({batch: e.target.value})} />
                    )}
                    
                    <div className="flex gap-2 pt-4">
                      <button onClick={() => setActionType(null)} className="flex-1 p-3 bg-gray-100 rounded-xl font-bold text-sm text-gray-600">Back</button>
                      <button onClick={handleAction} className="flex-1 p-3 bg-cyan-600 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2">
                        {loading ? '...' : <>Save <Save size={16}/></>}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
};

export default ScanItem;