/**
 * @file Warehouse.jsx
 * @description React component for managing warehouse inventory, filtering, tab categorization, Excel reporting, and bulk exact-component barcode label generation for the JJTL WMS system.
 */

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { getAllItems } from '../api/itemService';
import { Download, Eye, Filter, Database, X, Search, FileText, Info } from 'lucide-react';
import RollBarcodeCard from '../components/RollBarcodeCard';
import ElementBarcodeCard from '../components/ElementBarcodeCard';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';
import { PDFDocument } from 'pdf-lib';

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

  // Ref tracker for hidden component DOM nodes and filter dropdown container
  const cardRefs = useRef({});
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
        keys: ['packingList', 'buyer', 'createdAt', 'poNo', 'element', 'netWeight', 'productDescription'],
        labels: ['Packing List', 'Buyer', 'Date', 'PO No', 'Element ID', 'Qty', 'Description']
      };
    } else if (activeTab === 'current') {
      return {
        keys: ['packingList', 'buyer', 'createdAt', 'poNo', 'element', 'locationName', 'netWeight', 'productDescription'],
        labels: ['Packing List', 'Buyer', 'Date', 'PO No', 'Element ID', 'Loc', 'Qty', 'Description']
      };
    }
    // Issued stock (hides location name, includes batches)
    return {
      keys: ['packingList', 'buyer', 'createdAt', 'poNo', 'element', 'batches', 'netWeight', 'productDescription'],
      labels: ['Packing List', 'Buyer', 'Date', 'PO No', 'Element ID', 'Batch', 'Qty', 'Description']
    };
  }, [activeTab]);


  // --- Tab Categorization Logic ---
  const tabFilteredItems = useMemo(() => {
    return items.filter(item => {
      const loc = item.locationName;
      const batch = item.batches;

      if (activeTab === 'packing') {
        // Packing List: locationName is null and batchNo is null
        return !loc && !batch;
      } else if (activeTab === 'current') {
        // Current Stock: locationName is not null and batchNo is null
        return Boolean(loc) && !batch;
      } else if (activeTab === 'issued') {
        // Issued Stock: locationName is null and batchNo is not null
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

  const toggleSelectAllFilters = (col) => {
    const allValues = getUniqueValues(col);
    setFilters(prev => ({ ...prev, [col]: prev[col]?.length === allValues.length ? [] : allValues }));
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

  // --- Bulk PDF Generation using Actual Component DOM & Authentic Barcodes ---
  const handleGenerateBulkPDF = async () => {
    if (selectedRows.length === 0) {
      alert("Please select at least one item to generate labels.");
      return;
    }

    setIsGeneratingPDF(true);

    try {
      const mergedPdf = await PDFDocument.create();
      const itemsToPrint = filteredItems.filter(item => selectedRows.includes(item._id));

      // Wait for hidden elements to fully mount and render their internal barcode SVGs/canvases
      await new Promise(resolve => setTimeout(resolve, 800));

      for (const item of itemsToPrint) {
        const domNode = cardRefs.current[item._id];
        if (!domNode) continue;

        // Capture exact rendered component layout with high fidelity scale
        const canvas = await html2canvas(domNode, {
          scale: 3,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff'
        });

        const imgData = canvas.toDataURL('image/png');

        // Create individual page with exact 4x2 landscape dimensions
        const singleDoc = new jsPDF({
          orientation: 'landscape',
          unit: 'in',
          format: [4, 2]
        });

        singleDoc.addImage(imgData, 'PNG', 0, 0, 4, 2);

        // Convert page to buffer and merge into master PDF using pdf-lib
        const pdfBytes = singleDoc.output('arraybuffer');
        const donorPdf = await PDFDocument.load(pdfBytes);
        const [copiedPage] = await mergedPdf.copyPages(donorPdf, [0]);
        mergedPdf.addPage(copiedPage);
      }

      const mergedPdfBytes = await mergedPdf.save();
      const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `Bulk_${cardType}_Labels_${Date.now()}.pdf`;
      link.click();
    } catch (error) {
      console.error("Error generating exact component PDF:", error);
      alert("Failed to generate PDF labels.");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

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
            onClick={handleGenerateBulkPDF} 
            disabled={isGeneratingPDF || selectedRows.length === 0}
            className="flex items-center gap-2 bg-amber-50 text-amber-700 px-4 py-2.5 rounded-2xl border border-amber-200 hover:bg-amber-100 transition-all font-semibold shadow-sm disabled:opacity-50 text-sm"
          >
            <FileText size={18} /> {isGeneratingPDF ? 'Generating Barcodes...' : 'Download PDF Labels'}
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
                          className="absolute top-16 left-0 bg-white shadow-2xl border border-gray-200 rounded-2xl p-3.5 w-56 z-30 max-h-72 overflow-y-auto"
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
                              checked={filters[colKey]?.length === getUniqueValues(colKey).length && getUniqueValues(colKey).length > 0} 
                              onChange={() => toggleSelectAllFilters(colKey)} 
                            /> 
                            Select All
                          </label>
                          <div className="border-t border-gray-100 my-1"></div>
                          {getUniqueValues(colKey).filter(v => String(v).toLowerCase().includes(filterSearch.toLowerCase())).map(val => (
                            <label key={val} className="flex items-center gap-2 text-xs text-gray-600 py-1.5 px-1 cursor-pointer hover:bg-gray-50 rounded-lg">
                              <input 
                                type="checkbox" 
                                className="w-3.5 h-3.5 rounded border-gray-300 text-cyan-600 focus:ring-cyan-600 accent-cyan-600 cursor-pointer"
                                checked={filters[colKey]?.includes(val)} 
                                onChange={() => toggleFilter(colKey, val)} 
                              /> 
                              <span className="truncate" title={val}>{val}</span>
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
              {/* 1. Added to Packing List */}
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

              {/* 2. Location Allocated */}
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

              {/* 3. Update History List */}
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

              {/* 4. Exit Details */}
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

      {/* Hidden Off-Screen Container mounting actual components to guarantee exact layout and authentic barcodes */}
      {isGeneratingPDF && (
        <div className="fixed top-[-9999px] left-[-9999px] opacity-0 pointer-events-none flex flex-col gap-4">
          {filteredItems
            .filter(item => selectedRows.includes(item._id))
            .map((item) => (
              <div 
                key={`exact-component-node-${item._id}`} 
                ref={el => { if (el) cardRefs.current[item._id] = el; }}
                style={{ width: '4in', height: '2in', background: '#ffffff', overflow: 'hidden', boxSizing: 'border-box' }}
              >
                {cardType === 'roll' ? (
                  <RollBarcodeCard itemData={item} />
                ) : (
                  <ElementBarcodeCard itemData={item} />
                )}
              </div>
          ))}
        </div>
      )}

    </div>
  );
};

export default Warehouse;