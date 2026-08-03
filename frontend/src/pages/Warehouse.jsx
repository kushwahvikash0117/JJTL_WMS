/**
 * @file Warehouse.jsx
 * @description React component for managing warehouse inventory, filtering, tab categorization, Excel reporting, and centralized sticker generation for both single and bulk items.
 */

import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { getAllItems } from '../api/itemService';
import { Download, Eye, Filter, Database, X, Search, FileText, Info } from 'lucide-react';
import RollBarcodeCard from '../components/RollBarcodeCard';
import ElementBarcodeCard from '../components/ElementBarcodeCard';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';

/**
 * Warehouse Component
 * 
 * @returns {JSX.Element} The rendered Warehouse component
 */
const Warehouse = () => {
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [historyItem, setHistoryItem] = useState(null); // State for History modal
  const [cardType, setCardType] = useState('roll');
  
  // Tab State
  const [activeTab, setActiveTab] = useState('packing'); // 'packing' | 'current' | 'issued'

  // Filter States
  const [filters, setFilters] = useState({});
  const [activeFilterColumn, setActiveFilterColumn] = useState(null);
  const [filterSearch, setFilterSearch] = useState('');
  
  // Row Selection & PDF Generation States
  const [selectedRows, setSelectedRows] = useState([]);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  
  // Dedicated state for print items to prevent React batching/async race conditions with selectedRows
  const [printItems, setPrintItems] = useState([]);

  // Ref tracker for hidden container and filter dropdown
  const containerRef = useRef(null);
  const filterDropdownRef = useRef(null);

  useEffect(() => { 
    fetchItems(); 
  }, []);

  // Close filter dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target)) {
        setActiveFilterColumn(null);
        setFilterSearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  /**
   * Helper function to format numbers up to 2 decimal places if they are decimals.
   * 
   * @param {any} val - Value to format
   * @returns {string|any} Formatted value
   */
  const formatNumber = (val) => {
    if (typeof val === 'number' || (!isNaN(val) && val !== '' && val !== null && val !== undefined)) {
      const num = Number(val);
      return Number.isInteger(num) ? num : num.toFixed(2);
    }
    return val;
  };

  /**
   * Fetches all inventory items from the warehouse API.
   */
  const fetchItems = async () => {
    try {
      const { data } = await getAllItems();
      setItems(data);
    } catch (err) { console.error(err); }
  };

  // --- Dynamic Columns Logic ---
  const { keys: activeColumns, labels: activeColumnLabels } = useMemo(() => {
    if (activeTab === 'packing') {
      return {
        keys: ['packingList', 'buyer', 'createdAt', 'poNo', 'element', 'currentQuantity', 'productDescription'],
        labels: ['Packing List', 'Buyer', 'Date', 'PO No', 'Element ID', 'Qty', 'Description']
      };
    } else if (activeTab === 'current') {
      return {
        keys: ['packingList', 'buyer', 'createdAt', 'poNo', 'element', 'locationName', 'currentQuantity', 'productDescription'],
        labels: ['Packing List', 'Buyer', 'Date', 'PO No', 'Element ID', 'Loc', 'Qty', 'Description']
      };
    }
    return {
      keys: ['packingList', 'buyer', 'createdAt', 'poNo', 'element', 'batches', 'currentQuantity', 'productDescription'],
      labels: ['Packing List', 'Buyer', 'Date', 'PO No', 'Element ID', 'Batch', 'Qty', 'Description']
    };
  }, [activeTab]);


  // --- Tab Categorization Logic ---
  const tabFilteredItems = useMemo(() => {
    return items.filter(item => {
      const loc = item.locationName;
      const batch = item.batches;

      if (activeTab === 'packing') {
        return !loc && !batch;
      } else if (activeTab === 'current') {
        return Boolean(loc);
      } else if (activeTab === 'issued') {
        return !loc && Boolean(batch);
      }
      return true;
    });
  }, [items, activeTab]);

  const getUniqueValues = (column) => [...new Set(tabFilteredItems.map(item => {
    if (column === 'createdAt' && item[column]) {
      return new Date(item[column]).toLocaleDateString();
    }
    if (column === 'qty') {
      return formatNumber(item[column]);
    }
    return item[column];
  }))].filter(Boolean);

  const filteredItems = useMemo(() => {
    return tabFilteredItems.filter(item => {
      return Object.entries(filters).every(([col, selectedValues]) => {
        if (!selectedValues || selectedValues.length === 0) return true;
        let val = item[col];
        if (col === 'createdAt' && val) {
          val = new Date(val).toLocaleDateString();
        } else if (col === 'qty') {
          val = formatNumber(val);
        }
        return selectedValues.includes(val);
      });
    });
  }, [tabFilteredItems, filters]);

  // --- Total Quantity Calculation for Current Stock ---
  const totalFilteredQuantity = useMemo(() => {
    if (activeTab !== 'current') return 0;
    return filteredItems.reduce((sum, item) => {
      const qty = item.currentQuantity !== undefined && item.currentQuantity !== null ? item.currentQuantity : item.qty;
      const num = Number(qty);
      return sum + (isNaN(num) ? 0 : num);
    }, 0);
  }, [filteredItems, activeTab]);

  /**
   * Resets selected rows and filters when switching inventory tabs.
   * 
   * @param {string} tab - The target tab identifier
   */
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSelectedRows([]);
    setFilters({});
    setActiveFilterColumn(null);
    setFilterSearch('');
  };

  // --- Filtering Logic ---
  const toggleFilter = (col, value) => {
    setFilters(prev => {
      const current = prev[col] || [];
      const updated = current.includes(value) ? current.filter(v => v !== value) : [...current, value];
      return { ...prev, [col]: updated };
    });
  };

  const toggleSelectAllFilters = (col, searchFilteredValues) => {
    setFilters(prev => {
      const allSelected = searchFilteredValues.every(val => prev[col]?.includes(val));
      if (allSelected) {
        // Remove searchFilteredValues from current selection
        const updated = (prev[col] || []).filter(v => !searchFilteredValues.includes(v));
        return { ...prev, [col]: updated };
      } else {
        // Add all searchFilteredValues while keeping other selections unique
        const combined = Array.from(new Set([...(prev[col] || []), ...searchFilteredValues]));
        return { ...prev, [col]: combined };
      }
    });
  };

  // --- Row Selection Logic ---
  const handleSelectRow = (itemId) => {
    setSelectedRows(prev => 
      prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
    );
  };

  const handleSelectAllRows = () => {
    if (selectedRows.length === filteredItems.length && filteredItems.length > 0) {
      setSelectedRows([]);
    } else {
      setSelectedRows(filteredItems.map(item => item._id));
    }
  };

  // --- Excel Export ---
  const handleExportExcel = () => {
    if (selectedRows.length === 0) {
      alert("Please select at least one item to export.");
      return;
    }
    const dataToExport = filteredItems.filter(item => selectedRows.includes(item._id)).map(item => ({
      ...item,
      qty: item.qty !== undefined && item.qty !== null ? Number(formatNumber(item.qty)) : item.qty,
      createdAt: item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A'
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Inventory");
    XLSX.writeFile(workbook, `${activeTab}_Inventory_Report.xlsx`);
  };

  // --- Centralized function to get target items required for sticker printing (Single or Bulk) ---
  const getItemsForStickers = useCallback((singleItem = null) => {
    if (singleItem) {
      return [singleItem];
    }
    return filteredItems.filter(item => selectedRows.includes(item._id));
  }, [filteredItems, selectedRows]);

  // --- Unified PDF Generation Handler (supports both single item preview modal & bulk table selection) ---
  const handleGeneratePDF = useCallback(async (targetItem = null) => {
    const itemsToPrint = getItemsForStickers(targetItem);

    if (itemsToPrint.length === 0) {
      alert("Please select at least one item to generate labels.");
      return;
    }

    setIsGeneratingPDF(true);
    setPrintItems(itemsToPrint);

    try {
      // Allow DOM to update and render cards safely
      await new Promise(resolve => setTimeout(resolve, 400));

      if (!containerRef.current) return;
      const cardElements = containerRef.current.querySelectorAll(':scope > .barcode-card-item');
      if (cardElements.length === 0) {
        setIsGeneratingPDF(false);
        setPrintItems([]);
        return;
      }

      const pdf = new jsPDF('landscape', 'in', [4, 2]);

      for (let i = 0; i < cardElements.length; i++) {
        const cardEl = cardElements[i];
        const canvas = await html2canvas(cardEl, { 
          scale: 3, // Increased scale to 3 for high-resolution, crystal-clear labels and barcodes
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff'
        });
        
        // JPEG format with 0.95 high quality for maximum visual clarity
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        
        if (i > 0) {
          pdf.addPage([4, 2], 'landscape');
        }
        
        pdf.addImage(imgData, 'JPEG', 0.1, 0.1, 3.8, 1.8, undefined, 'FAST');
      }

      const fileName = itemsToPrint.length === 1 
        ? `Label_${cardType === 'roll' ? (itemsToPrint[0].rollNo || 'N/A') : (itemsToPrint[0].element || 'N/A')}.pdf` 
        : `Bulk_${cardType}_Labels_${itemsToPrint.length}_Items.pdf`;

      pdf.save(fileName);
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("Failed to generate PDF label.");
    } finally {
      setIsGeneratingPDF(false);
      setPrintItems([]);
    }
  }, [getItemsForStickers, cardType]);

  return (
    <div className="p-4 sm:p-8 bg-gray-50 min-h-screen relative">
      
      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h2 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
          <Database className="text-cyan-600" /> Inventory
        </h2>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Card Format Toggles */}
          <div className="flex bg-gray-200 p-1 rounded-xl mr-2">
            <button 
              onClick={() => setCardType('roll')} 
              className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all ${cardType === 'roll' ? 'bg-white shadow text-cyan-600' : 'text-gray-500'}`}
            >
              Roll Labels
            </button>
            <button 
              onClick={() => setCardType('element')} 
              className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all ${cardType === 'element' ? 'bg-white shadow text-cyan-600' : 'text-gray-500'}`}
            >
              Element Labels
            </button>
          </div>

          <button 
            onClick={() => handleGeneratePDF()} 
            disabled={isGeneratingPDF || selectedRows.length === 0}
            className="flex items-center gap-2 bg-amber-50 text-amber-700 px-4 py-2.5 rounded-2xl border border-amber-200 hover:bg-amber-100 transition-all font-semibold shadow-sm disabled:opacity-50 text-sm"
          >
            <FileText size={18} /> {isGeneratingPDF ? 'Generating Barcodes...' : `Download PDF Labels (${getItemsForStickers().length})`}
          </button>
          <button 
            onClick={handleExportExcel} 
            disabled={selectedRows.length === 0}
            className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-2xl border border-gray-200 hover:border-cyan-500 hover:text-cyan-600 transition-all font-semibold shadow-sm disabled:opacity-50 text-sm"
          >
            <Download size={18} /> Export Excel
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-gray-200 mb-6 gap-8">
        <button
          onClick={() => handleTabChange('packing')}
          className={`pb-3 font-bold text-sm border-b-2 transition-all ${activeTab === 'packing' ? 'border-cyan-600 text-cyan-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          Packing List
        </button>
        <button
          onClick={() => handleTabChange('current')}
          className={`pb-3 font-bold text-sm border-b-2 transition-all ${activeTab === 'current' ? 'border-cyan-600 text-cyan-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          Current Stock
        </button>
        <button
          onClick={() => handleTabChange('issued')}
          className={`pb-3 font-bold text-sm border-b-2 transition-all ${activeTab === 'issued' ? 'border-cyan-600 text-cyan-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          Issued Stock
        </button>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-500 uppercase text-[10px] tracking-wider font-bold">
              <tr>
                <th className="px-6 py-5 w-12">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded border-gray-300 text-cyan-600 focus:ring-cyan-600 cursor-pointer accent-cyan-600"
                    checked={selectedRows.length === filteredItems.length && filteredItems.length > 0}
                    onChange={handleSelectAllRows}
                  />
                </th>
                <th className="px-4 py-5 w-16">S.No.</th>
                {activeColumnLabels.map((h, i) => {
                  const colKey = activeColumns[i];
                  const hasActiveFilter = filters[colKey] && filters[colKey].length > 0;
                  const uniqueVals = getUniqueValues(colKey);
                  const searchFilteredVals = uniqueVals.filter(v => {
                    if (colKey === 'productDescription') {
                      const searchWords = filterSearch.toLowerCase().trim().split(/\s+/).filter(Boolean);
                      if (searchWords.length === 0) return true;
                      const targetStr = String(v).toLowerCase();
                      return searchWords.every(word => targetStr.includes(word));
                    }
                    return String(v).toLowerCase().includes(filterSearch.toLowerCase());
                  });

                  return (
                    <th key={h} className="px-6 py-5 relative">
                      <div className="flex items-center gap-1 whitespace-nowrap">
                        {h}
                        {colKey && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveFilterColumn(activeFilterColumn === colKey ? null : colKey);
                              setFilterSearch('');
                            }} 
                            className={`p-1.5 rounded-lg transition-colors ${hasActiveFilter ? 'bg-cyan-100 text-cyan-700' : 'hover:bg-gray-200 text-gray-500'}`}
                            title="Filter Column"
                          >
                            <Filter size={12} />
                          </button>
                        )}
                      </div>
                      {activeFilterColumn === colKey && (
                        <div 
                          ref={filterDropdownRef}
                          className="absolute top-16 left-0 bg-white shadow-2xl border border-gray-200 rounded-2xl p-3.5 w-64 z-30 max-h-72 overflow-y-auto"
                        >
                          <div className="relative mb-2.5">
                            <Search className="absolute left-2.5 top-2.5 text-gray-400" size={14} />
                            <input 
                              autoFocus 
                              placeholder="Search options..." 
                              className="w-full pl-8 pr-2 py-1.5 text-xs border border-gray-200 rounded-xl outline-none focus:border-cyan-500" 
                              value={filterSearch} 
                              onChange={(e) => setFilterSearch(e.target.value)} 
                            />
                          </div>
                          <label className="flex items-center gap-2 text-xs font-bold mb-1.5 p-1 cursor-pointer hover:bg-gray-50 rounded-lg">
                            <input 
                              type="checkbox" 
                              className="w-3.5 h-3.5 rounded border-gray-300 text-cyan-600 focus:ring-cyan-600 accent-cyan-600 cursor-pointer"
                              checked={searchFilteredVals.length > 0 && searchFilteredVals.every(val => filters[colKey]?.includes(val))} 
                              onChange={() => toggleSelectAllFilters(colKey, searchFilteredVals)} 
                            /> 
                            Select All
                          </label>
                          <div className="border-t border-gray-100 my-1"></div>
                          {searchFilteredVals.map(val => (
                            <label key={val} className="flex items-center gap-2 text-xs text-gray-600 py-1.5 px-1 cursor-pointer hover:bg-gray-50 rounded-lg">
                              <input 
                                type="checkbox" 
                                className="w-3.5 h-3.5 rounded border-gray-300 text-cyan-600 focus:ring-cyan-600 accent-cyan-600 cursor-pointer"
                                checked={filters[colKey]?.includes(val)} 
                                onChange={() => toggleFilter(colKey, val)} 
                              /> 
                              <span className="whitespace-normal break-words" title={val}>{val}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </th>
                  );
                })}
                <th className="px-6 py-5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredItems.map((item, index) => (
                <tr key={item._id} className="hover:bg-cyan-50/30">
                  <td className="px-6 py-4">
                    <input 
                      type="checkbox"
                      className="w-4 h-4 rounded border-gray-300 text-cyan-600 focus:ring-cyan-600 cursor-pointer accent-cyan-600"
                      checked={selectedRows.includes(item._id)}
                      onChange={() => handleSelectRow(item._id)}
                    />
                  </td>
                  <td className="px-4 py-4 text-sm font-medium text-gray-500">{index + 1}</td>
                  {activeColumns.map(col => {
                    let displayVal = item[col];
                    if (col === 'createdAt' && displayVal) {
                      displayVal = new Date(displayVal).toLocaleDateString();
                    } else if (col === 'qty') {
                      displayVal = formatNumber(displayVal);
                    }
                    
                    let cellStyle = "px-6 py-4 text-sm text-gray-600 ";
                    if (col === 'productDescription') {
                      cellStyle += "whitespace-normal break-words min-w-[250px]";
                    } else if (col === 'element') {
                      cellStyle += "whitespace-normal break-words min-w-[180px]";
                    } else {
                      cellStyle += "max-w-[150px] truncate";
                    }

                    return (
                      <td 
                        key={col} 
                        className={cellStyle}
                        title={col !== 'productDescription' && col !== 'element' ? displayVal : undefined}
                      >
                        {displayVal !== undefined && displayVal !== null && displayVal !== '' ? displayVal : "N/A"}
                      </td>
                    );
                  })}
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button 
                        onClick={() => setSelectedItem(item)} 
                        className="text-cyan-600 bg-cyan-50 p-2 rounded-xl hover:bg-cyan-100 transition-colors"
                        title="View Label"
                      >
                        <Eye size={16}/>
                      </button>
                      <button 
                        onClick={() => setHistoryItem(item)} 
                        className="text-amber-600 bg-amber-50 p-2 rounded-xl hover:bg-amber-100 transition-colors"
                        title="View Complete History"
                      >
                        <Info size={16}/>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={activeColumns.length + 3} className="px-6 py-8 text-center text-gray-500">
                    No items found matching the current filters.
                  </td>
                </tr>
              )}
            </tbody>
            
            {/* Total Quantity Footer Row for Current Stock Tab */}
            {activeTab === 'current' && filteredItems.length > 0 && (
              <tfoot className="bg-gray-50 font-bold border-t border-gray-200">
                <tr>
                  <td colSpan={activeColumns.indexOf('currentQuantity') + 2} className="px-6 py-4 text-right text-gray-700 text-sm">
                    Total Quantity:
                  </td>
                  <td className="px-6 py-4 text-cyan-700 text-sm">
                    {formatNumber(totalFilteredQuantity)}
                  </td>
                  <td colSpan={activeColumns.length - activeColumns.indexOf('currentQuantity') + 1} />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Single Item Label Preview Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 md:p-8 rounded-3xl w-full max-w-lg shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">Label Preview</h3>
              <button onClick={() => setSelectedItem(null)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
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

            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex justify-center overflow-hidden">
              {cardType === 'roll' ? (
                <RollBarcodeCard itemData={selectedItem} />
              ) : (
                <ElementBarcodeCard itemData={selectedItem} />
              )}
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => handleGeneratePDF(selectedItem)}
                className="bg-cyan-700 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-cyan-800 transition flex items-center gap-1.5"
              >
                <Download size={14} /> Download PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Complete History Modal */}
      {historyItem && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 md:p-8 rounded-3xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-100">
              <div>
                <h3 className="font-bold text-lg text-gray-900">Item Lifecycle History</h3>
                <p className="text-xs text-gray-400 font-mono">Roll No: {historyItem.rollNo || 'N/A'}</p>
              </div>
              <button onClick={() => setHistoryItem(null)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-100">
                <span className="font-semibold text-gray-400 uppercase text-[10px] block mb-1">1. Packing List Entry</span>
                <div className="flex justify-between items-center">
                  <p className="font-bold text-gray-800 text-sm">
                    {historyItem.createdAt ? new Date(historyItem.createdAt).toLocaleString() : 'N/A'}
                  </p>
                  <span className="font-extrabold text-cyan-600 text-sm">
                    Original Qty: {formatNumber(historyItem.initialQuantity !== undefined ? historyItem.initialQuantity : historyItem.qty)} Kg
                  </span>
                </div>
              </div>

              <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-100">
                <span className="font-semibold text-gray-400 uppercase text-[10px] block mb-1">2. Location Allocation</span>
                {historyItem.itemEntered ? (
                  <div>
                    <p className="font-bold text-gray-800 text-sm">{new Date(historyItem.itemEntered).toLocaleString()}</p>
                    <p className="text-cyan-600 font-semibold mt-0.5">Location: {historyItem.locationName || 'Assigned'}</p>
                  </div>
                ) : (
                  <p className="text-gray-500 italic">Not yet allocated a location</p>
                )}
              </div>

              <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-100">
                <span className="font-semibold text-gray-400 uppercase text-[10px] block mb-2">3. Update History</span>
                {historyItem.updateHistory && historyItem.updateHistory.length > 0 ? (
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {historyItem.updateHistory.map((upd, index) => (
                      <div key={index} className="bg-white p-2.5 rounded-xl border border-gray-200 flex justify-between items-center">
                        <div>
                          <p className="font-bold text-gray-700">Batch: {upd.batchNo}</p>
                          <p className="text-[10px] text-gray-400">{new Date(upd.timestamp).toLocaleString()}</p>
                        </div>
                        <span className="font-extrabold text-cyan-600 text-sm">-{formatNumber(upd.quantityGone)} Kg</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 italic">No update actions recorded</p>
                )}
              </div>

              <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-100">
                <span className="font-semibold text-gray-400 uppercase text-[10px] block mb-1">4. Exit Details</span>
                {historyItem.exitDetails && historyItem.exitDetails.timestamp ? (
                  <div>
                    <div className="flex justify-between items-center">
                      <p className="font-bold text-gray-800 text-sm">{new Date(historyItem.exitDetails.timestamp).toLocaleString()}</p>
                      <span className="font-extrabold text-rose-600 text-sm">
                        Exited Qty: {formatNumber(historyItem.currentQuantity)} Kg
                      </span>
                    </div>
                    <p className="text-rose-600 font-semibold mt-0.5">Exit Batch No: {historyItem.exitDetails.batchNo || 'N/A'}</p>
                  </div>
                ) : (
                  <p className="text-gray-500 italic">Item has not exited warehouse</p>
                )}
              </div>
            </div>

            <button
              onClick={() => setHistoryItem(null)}
              className="w-full mt-5 bg-gray-900 text-white py-2.5 rounded-2xl font-semibold hover:bg-gray-800 transition-colors text-xs"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Hidden container mounting dedicated print items to prevent race conditions and duplicate DOM nodes */}
      <div 
        ref={containerRef}
        className="fixed top-[-9999px] left-[-9999px] opacity-0 pointer-events-none flex flex-col gap-4"
      >
        {printItems.map((item) => (
          <div key={`container-card-${item._id}`} className="barcode-card-item">
            {cardType === 'roll' ? (
              <RollBarcodeCard itemData={item} />
            ) : (
              <ElementBarcodeCard itemData={item} />
            )}
          </div>
        ))}
      </div>

    </div>
  );
};

export default Warehouse;