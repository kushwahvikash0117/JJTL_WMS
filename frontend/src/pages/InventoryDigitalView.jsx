/**
 * @file InventoryDigitalView.jsx
 * @description React component rendering a digital interactive visual map of all 12 warehouse racks, showing real-time capacity and weight status per bin.
 */

import React, { useState, useEffect } from 'react';
import { getAllItems } from '../api/itemService';
import { getBinStatus } from '../api/binService';
import { LOCATION_BARCODE_MAP } from '../utils/constants';
import { LayoutGrid, Database, RefreshCw, Package, Weight, Layers, Eye, X } from 'lucide-react';
import RollBarcodeCard from '../components/RollBarcodeCard';
import ElementBarcodeCard from '../components/ElementBarcodeCard';

const BIN_CAPACITY_KG = 280;

/**
 * InventoryDigitalView Component
 * 
 * @returns {JSX.Element} The rendered InventoryDigitalView component
 */
const InventoryDigitalView = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCellData, setSelectedCellData] = useState(null);
  const [selectedRollItem, setSelectedRollItem] = useState(null); // State for individual roll details modal
  const [cardType, setCardType] = useState('roll'); // Card type toggle for label preview
  const [fetchingSlot, setFetchingSlot] = useState(false);

  useEffect(() => {
    fetchInventory();
  }, []);

  /**
   * Fetches all inventory items from the backend API.
   */
  const fetchInventory = async () => {
    try {
      setLoading(true);
      const { data } = await getAllItems();
      setItems(data);
    } catch (err) {
      console.error("Error fetching inventory for digital view:", err);
    } finally {
      setLoading(false);
    }
  };

  // Define the 12 racks structure
  const racksConfig = [
    { id: 1, name: 'Rack 1', rows: 4, cols: 8 },
    { id: 2, name: 'Rack 2', rows: 4, cols: 8 },
    { id: 3, name: 'Rack 3', rows: 4, cols: 8 },
    { id: 4, name: 'Rack 4', rows: 4, cols: 8 },
    { id: 5, name: 'Rack 5', rows: 4, cols: 8 },
    { id: 6, name: 'Rack 6', rows: 4, cols: 8 },
    { id: 7, name: 'Rack 7', rows: 4, cols: 15 },
    { id: 8, name: 'Rack 8', rows: 4, cols: 15 },
    { id: 9, name: 'Rack 9', rows: 4, cols: 15 },
    { id: 10, name: 'Rack 10', rows: 4, cols: 15 },
    { id: 11, name: 'Rack 11', rows: 4, cols: 15 },
    { id: 12, name: 'Rack 12', rows: 4, cols: 15 },
  ];

  /**
   * Formats location key string based on rack, column, and row numbers.
   * 
   * @param {number} rackId - Rack identifier
   * @param {number} colNum - Column number
   * @param {number} rowNum - Row number
   * @returns {string} Formatted location key string (e.g., "01-02-03")
   */
  const formatLocationKey = (rackId, colNum, rowNum) => {
    const rStr = String(rackId).padStart(2, '0');
    const cStr = String(colNum).padStart(2, '0');
    const rowStr = String(rowNum).padStart(2, '0');
    return `${rStr}-${cStr}-${rowStr}`;
  };

  /**
   * Filters items stored in a specific slot.
   * 
   * @param {number} rackId - Rack identifier
   * @param {number} colNum - Column number
   * @param {number} rowNum - Row number
   * @returns {Array<Object>} List of items in the slot
   */
  const getSlotItems = (rackId, colNum, rowNum) => {
    const locKey = formatLocationKey(rackId, colNum, rowNum);
    return items.filter(item => String(item.locationName || '').trim() === locKey);
  };

  /**
   * Calculates the total quantity/weight for items in a slot.
   * 
   * @param {Array<Object>} slotItems - List of items in the slot
   * @returns {number} Total weight/quantity
   */
  const getSlotTotalQty = (slotItems) => {
    return slotItems.reduce((acc, curr) => {
      const val = curr.currentQuantity !== undefined && curr.currentQuantity !== null ? curr.currentQuantity : curr.qty;
      return acc + Number(val || 0);
    }, 0);
  };

  /**
   * Determines the Tailwind CSS color classes for a grid cell based on its fill percentage.
   * 
   * @param {number} totalQty - Total quantity/weight in the bin
   * @returns {string} CSS class string
   */
  const getCellColorClass = (totalQty) => {
    if (totalQty <= 0) return 'bg-white hover:bg-gray-50 text-gray-400';
    const percentage = (totalQty / BIN_CAPACITY_KG) * 100;
    
    if (percentage > 75) {
      return 'bg-red-100 text-red-900 border-red-300 font-bold hover:bg-red-200';
    } else if (percentage >= 35) {
      return 'bg-amber-100 text-amber-900 border-amber-300 font-bold hover:bg-amber-200';
    } else {
      return 'bg-emerald-100 text-emerald-900 border-emerald-300 font-bold hover:bg-emerald-200';
    }
  };

  /**
   * Handles click event on a specific bin cell in the rack grid.
   * 
   * @param {number} rackId - Rack identifier
   * @param {number} colNum - Column number
   * @param {number} rowNum - Row number
   */
  const handleCellClick = async (rackId, colNum, rowNum) => {
    const locKey = formatLocationKey(rackId, colNum, rowNum);
    const barcode = LOCATION_BARCODE_MAP[locKey];
    const slotItems = getSlotItems(rackId, colNum, rowNum);

    if (!barcode) {
      setSelectedCellData({ locationKey: locKey, barcode: 'N/A', slotItems, binDetails: null });
      return;
    }

    try {
      setFetchingSlot(true);
      const response = await getBinStatus(barcode);
      setSelectedCellData({ locationKey: locKey, barcode, slotItems, binDetails: response.data });
    } catch (err) {
      console.error(`Error fetching bin status for barcode ${barcode}:`, err);
      setSelectedCellData({ locationKey: locKey, barcode, slotItems, binDetails: null });
    } finally {
      setFetchingSlot(false);
    }
  };

  return (
    <div className="p-4 sm:p-8 bg-gray-50 min-h-screen">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
            <LayoutGrid className="text-cyan-600" /> Inventory Digital View
          </h2>
          <p className="text-sm text-gray-500 mt-1">Real-time capacity status of all 12 warehouse racks (Max Capacity: 280 Kg/bin).</p>
        </div>
        
        <button 
          onClick={fetchInventory} 
          disabled={loading}
          className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-2xl border border-gray-200 hover:border-cyan-500 hover:text-cyan-600 transition-all font-semibold shadow-sm text-sm"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Refresh Status
        </button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm mb-6 text-xs font-semibold text-gray-600">
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 bg-red-100 border border-red-300 rounded"></span> Red: High Filled (&gt; 75%)
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 bg-amber-100 border border-amber-300 rounded"></span> Yellow: Medium (35% - 75%)
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 bg-emerald-100 border border-emerald-300 rounded"></span> Green: Low (&lt; 35%)
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 bg-white border border-gray-300 rounded"></span> White: Empty (0 Kg)
        </div>
      </div>

      {/* Racks Grid Container */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {racksConfig.map((rack) => (
          <div key={rack.id} className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 overflow-x-auto">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-gray-800 text-sm">{rack.name}</h3>
              <span className="text-[10px] bg-gray-100 px-2.5 py-1 rounded-full font-bold text-gray-500">
                {rack.cols} Cols × {rack.rows} Rows
              </span>
            </div>

            <div className="min-w-max">
              <table className="w-full border-collapse text-[10px] text-center font-medium">
                <thead>
                  <tr className="bg-gray-50 text-gray-500">
                    <th className="border border-gray-200 p-1.5 w-12">Row</th>
                    {Array.from({ length: rack.cols }, (_, i) => i + 1).map(col => (
                      <th key={col} className="border border-gray-200 p-1.5 min-w-[55px]">
                        Col {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[4, 3, 2, 1].map(rowNum => (
                    <tr key={rowNum}>
                      <td className="border border-gray-200 font-bold bg-gray-50 text-gray-600 p-1.5">
                        Row {rowNum}
                      </td>
                      {Array.from({ length: rack.cols }, (_, i) => i + 1).map(colNum => {
                        const locKey = formatLocationKey(rack.id, colNum, rowNum);
                        const slotItems = getSlotItems(rack.id, colNum, rowNum);
                        const totalQty = getSlotTotalQty(slotItems);
                        const colorClass = getCellColorClass(totalQty);
                        
                        return (
                          <td 
                            key={colNum}
                            onClick={() => handleCellClick(rack.id, colNum, rowNum)}
                            className={`border border-gray-200 p-1.5 transition-all cursor-pointer truncate ${colorClass}`}
                            title={`Location: ${locKey} | Barcode: ${LOCATION_BARCODE_MAP[locKey] || 'N/A'} | Qty: ${totalQty.toFixed(2)} Kg`}
                          >
                            {locKey}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      {/* Bin Summary Popup Modal */}
      {selectedCellData && (() => {
        const currentTotalQty = getSlotTotalQty(selectedCellData.slotItems);
        const availableCapacity = Math.max(0, BIN_CAPACITY_KG - currentTotalQty);
        const numberOfRolls = selectedCellData.slotItems.length;

        return (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white p-6 md:p-7 rounded-3xl w-full max-w-sm shadow-2xl">
              
              {/* Modal Header */}
              <div className="flex justify-between items-center pb-3 border-b border-gray-100 mb-5">
                <div>
                  <h3 className="font-bold text-base text-gray-900">Bin Summary</h3>
                  <p className="text-xs text-gray-400 font-mono mt-0.5">Loc: {selectedCellData.locationKey} | Barcode: {selectedCellData.barcode}</p>
                </div>
                <button 
                  onClick={() => setSelectedCellData(null)} 
                  className="w-7 h-7 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center text-gray-500 font-bold transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Main Info Blocks */}
              <div className="space-y-3 mb-6">
                
                {/* Available Space Suggestion Card */}
                <div className="bg-cyan-50 border border-cyan-100 rounded-2xl p-4 text-center">
                  <p className="text-xs font-medium text-cyan-600 uppercase tracking-wider mb-1">Available Space</p>
                  <p className="text-2xl font-extrabold text-cyan-900">{availableCapacity.toFixed(2)} <span className="text-sm font-semibold">Kg</span></p>
                  <p className="text-[11px] text-cyan-700 mt-1">You can add up to this weight in this bin.</p>
                </div>

                {/* Quick Count Stats Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 border border-gray-100 rounded-2xl p-3 text-center">
                    <p className="text-[11px] font-medium text-gray-400 uppercase">Current Weight</p>
                    <p className="text-lg font-bold text-gray-800 mt-0.5">{currentTotalQty.toFixed(2)} Kg</p>
                  </div>
                  <div className="bg-gray-50 border border-gray-100 rounded-2xl p-3 text-center">
                    <p className="text-[11px] font-medium text-gray-400 uppercase">Total Rolls</p>
                    <p className="text-lg font-bold text-gray-800 mt-0.5">{numberOfRolls} Roll(s)</p>
                  </div>
                </div>

                {/* Roll Details Preview */}
                {numberOfRolls > 0 && (
                  <div className="pt-1">
                    <p className="text-xs font-bold text-gray-600 mb-2">Stored Items Info (Click to view details):</p>
                    <div className="max-h-32 overflow-y-auto space-y-1.5 pr-1">
                      {selectedCellData.slotItems.map((item, idx) => {
                        const itemQty = item.currentQuantity !== undefined && item.currentQuantity !== null ? item.currentQuantity : item.qty;
                        return (
                          <div 
                            key={item._id || idx} 
                            onClick={() => setSelectedRollItem(item)}
                            className="bg-gray-50 px-3 py-2 rounded-xl border border-gray-100 flex justify-between items-center text-xs cursor-pointer hover:bg-cyan-50/50 hover:border-cyan-200 transition-all"
                          >
                            <span className="font-medium text-gray-700 truncate max-w-[180px]">
                              {item.productDescription || item.element || 'Roll Item'}
                            </span>
                            <span className="font-bold text-cyan-700">{Number(itemQty || 0).toFixed(2)} Kg</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => setSelectedCellData(null)}
                className="w-full bg-cyan-600 text-white py-2.5 rounded-2xl font-semibold hover:bg-cyan-700 transition-colors shadow-sm text-sm"
              >
                Done
              </button>
            </div>
          </div>
        );
      })()}

      {/* Individual Roll Details Modal */}
      {selectedRollItem && (() => {
        const itemQty = selectedRollItem.currentQuantity !== undefined && selectedRollItem.currentQuantity !== null ? selectedRollItem.currentQuantity : selectedRollItem.qty;
        return (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white p-6 md:p-8 rounded-3xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-100">
                <div>
                  <h3 className="font-bold text-lg text-gray-900">Roll Details</h3>
                  <p className="text-xs text-gray-400 font-mono">Roll No: {selectedRollItem.rollNo || 'N/A'}</p>
                </div>
                <button onClick={() => setSelectedRollItem(null)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
              </div>

              <div className="flex bg-gray-100 p-1 rounded-xl mb-4">
                <button 
                  onClick={() => setCardType('roll')} 
                  className={`flex-1 py-2 rounded-lg font-bold text-xs transition-all ${cardType === 'roll' ? 'bg-white shadow text-cyan-600' : 'text-gray-500'}`}
                >
                  Roll No Label
                </button>
                <button 
                  onClick={() => setCardType('element')} 
                  className={`flex-1 py-2 rounded-lg font-bold text-xs transition-all ${cardType === 'element' ? 'bg-white shadow text-cyan-600' : 'text-gray-500'}`}
                >
                  Element Label
                </button>
              </div>

              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex justify-center overflow-hidden mb-6">
                {cardType === 'roll' ? (
                  <RollBarcodeCard itemData={selectedRollItem} />
                ) : (
                  <ElementBarcodeCard itemData={selectedRollItem} />
                )}
              </div>

              <div className="space-y-3 text-xs mb-6">
                <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100 flex justify-between">
                  <span className="text-gray-400 font-medium">Buyer</span>
                  <span className="font-bold text-gray-800">{selectedRollItem.buyer || 'N/A'}</span>
                </div>
                <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100 flex justify-between">
                  <span className="text-gray-400 font-medium">PO No</span>
                  <span className="font-bold text-gray-800">{selectedRollItem.poNo || 'N/A'}</span>
                </div>
                <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100 flex justify-between">
                  <span className="text-gray-400 font-medium">Element ID</span>
                  <span className="font-bold text-gray-800">{selectedRollItem.element || 'N/A'}</span>
                </div>
                <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100 flex justify-between">
                  <span className="text-gray-400 font-medium">Quantity</span>
                  <span className="font-bold text-cyan-600">{itemQty !== undefined && itemQty !== null ? `${itemQty} Kg` : 'N/A'}</span>
                </div>
                <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100 flex justify-between">
                  <span className="text-gray-400 font-medium">Location</span>
                  <span className="font-bold text-gray-800">{selectedRollItem.locationName || 'N/A'}</span>
                </div>
              </div>

              <button
                onClick={() => setSelectedRollItem(null)}
                className="w-full bg-gray-900 text-white py-2.5 rounded-2xl font-semibold hover:bg-gray-800 transition-colors text-xs"
              >
                Close
              </button>
            </div>
          </div>
        );
      })()}

      {fetchingSlot && (
        <div className="fixed bottom-4 right-4 bg-gray-900 text-white px-4 py-2 rounded-xl text-xs shadow-lg flex items-center gap-2 z-50">
          <RefreshCw size={14} className="animate-spin text-cyan-400" /> Fetching slot barcode status...
        </div>
      )}

    </div>
  );
};

export default InventoryDigitalView;