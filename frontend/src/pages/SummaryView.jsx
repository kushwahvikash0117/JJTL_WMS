/**
 * @file SummaryView.jsx
 * @description Clean, professional JJTL WMS Summary & Traceability View with modal-based item details.
 */

import React, { useState, useEffect } from 'react';
import { 
  Filter, 
  Package, 
  FileText, 
  Layers, 
  ArrowDown, 
  Search, 
  ChevronRight,
  Loader2,
  RefreshCw,
  X,
  Clock,
  MapPin,
  Barcode,
  Calendar
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';

const SummaryView = () => {
  const [allItems, setAllItems] = useState([]);
  const [packingLists, setPackingLists] = useState([]);
  const [selectedPackingList, setSelectedPackingList] = useState('');
  const [poNumbers, setPoNumbers] = useState([]);
  const [selectedPoFilter, setSelectedPoFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  
  const [loadingFilters, setLoadingFilters] = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(false);

  const [poSummaryData, setPoSummaryData] = useState([]);
  const [selectedPO, setSelectedPO] = useState(null);

  const [batchIssueDetailsData, setBatchIssueDetailsData] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState(null);

  const [rollElementDetailsData, setRollElementDetailsData] = useState([]);

  const [selectedItemDetail, setSelectedItemDetail] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchAllItemsData();
  }, []);

  const fetchAllItemsData = async () => {
    try {
      setLoadingFilters(true);
      const response = await api.get('/items');
      const items = response.data.items || response.data;

      if (Array.isArray(items)) {
        setAllItems(items);
        setPackingLists([...new Set(items.map(item => item.packingList).filter(Boolean))]);
        setPoNumbers([...new Set(items.map(item => item.poNo).filter(Boolean))]);
        processSummaryData(items, '', '', '');
      }
    } catch (error) {
      console.error('Error fetching items:', error);
      toast.error('Failed to load items collection.');
    } finally {
      setLoadingFilters(false);
    }
  };

  const processSummaryData = (itemsToProcess, plFilter, poFilter, dateFilter) => {
    setLoadingSummary(true);

    try {
      const filtered = itemsToProcess.filter(item => {
        if (plFilter && item.packingList !== plFilter) return false;
        if (poFilter && item.poNo !== poFilter) return false;
        if (dateFilter) {
          const itemDateStr = item.itemEntered || item.createdAt;
          if (!itemDateStr) return false;
          const itemDate = new Date(itemDateStr).toISOString().split('T')[0];
          if (itemDate < dateFilter) return false;
        }
        return true;
      });

      const poMap = {};
      filtered.forEach(item => {
        const poKey = item.poNo || 'UNKNOWN_PO';
        if (!poMap[poKey]) {
          poMap[poKey] = {
            poNo: poKey,
            fabrication: item.productDescription || 'N/A',
            buyer: item.buyer || 'N/A',
            totalQty: 0,
            issuedQty: 0,
            balanceQty: 0,
            itemsList: []
          };
        }
        const initialQ = Number(item.initialQuantity || item.currentQuantity || 0);
        const currentQ = Number(item.currentQuantity || 0);
        poMap[poKey].totalQty += initialQ;
        poMap[poKey].balanceQty += currentQ;
        poMap[poKey].issuedQty += (initialQ - currentQ);
        poMap[poKey].itemsList.push(item);
      });

      setPoSummaryData(Object.values(poMap));
      setSelectedPO(null);
      setBatchIssueDetailsData([]);
      setSelectedBatch(null);
      setRollElementDetailsData([]);
    } catch (err) {
      console.error('Error processing filters:', err);
      toast.error('Error applying filters');
    } finally {
      setLoadingSummary(false);
    }
  };

  const handleApplyFilters = () => {
    processSummaryData(allItems, selectedPackingList, selectedPoFilter, dateFrom);
    toast.success('Filters applied');
  };

  const handleResetFilters = () => {
    setSelectedPackingList('');
    setSelectedPoFilter('');
    setDateFrom('');
    processSummaryData(allItems, '', '', '');
    toast.success('Filters cleared');
  };

  const handlePoSelect = (poSummary) => {
    setSelectedPO(poSummary);
    setSelectedBatch(null);
    setRollElementDetailsData([]);

    const poItems = poSummary.itemsList || [];
    const batchMap = {};

    poItems.forEach(item => {
      // 1. Process batch numbers from updateHistory
      if (Array.isArray(item.updateHistory) && item.updateHistory.length > 0) {
        item.updateHistory.forEach(hist => {
          const bNo = hist.batchNo || item.batches || 'DEFAULT_BATCH';
          if (!batchMap[bNo]) {
            batchMap[bNo] = {
              batchNo: bNo,
              issueDate: hist.timestamp ? new Date(hist.timestamp).toLocaleDateString() : 'N/A',
              issuedQty: 0,
              noOfRolls: new Set(),
              remarks: 'History Issue',
              matchedItems: []
            };
          }
          batchMap[bNo].issuedQty += Number(hist.quantityGone || 0);
          batchMap[bNo].noOfRolls.add(item.rollNo || item.element || item._id);
          if (!batchMap[bNo].matchedItems.some(i => i._id === item._id)) {
            batchMap[bNo].matchedItems.push(item);
          }
        });
      }

      // 2. Process exitDetails batch if exists
      if (item.exitDetails && item.exitDetails.batchNo) {
        const bNo = item.exitDetails.batchNo;
        if (!batchMap[bNo]) {
          batchMap[bNo] = {
            batchNo: bNo,
            issueDate: item.exitDetails.timestamp ? new Date(item.exitDetails.timestamp).toLocaleDateString() : 'N/A',
            issuedQty: 0,
            noOfRolls: new Set(),
            remarks: 'Batch Exit',
            matchedItems: []
          };
        }
        batchMap[bNo].issuedQty += (Number(item.initialQuantity || 0) - Number(item.currentQuantity || 0));
        batchMap[bNo].noOfRolls.add(item.rollNo || item.element || item._id);
        if (!batchMap[bNo].matchedItems.some(i => i._id === item._id)) {
          batchMap[bNo].matchedItems.push(item);
        }
      }

      // 3. Fallback to direct batch property if no updateHistory/exitDetails exist but quantity was reduced
      const hasHistoryOrExit = (item.updateHistory && item.updateHistory.length > 0) || (item.exitDetails && item.exitDetails.batchNo);
      const isQuantityIssued = Number(item.initialQuantity || 0) > Number(item.currentQuantity || 0);

      if (!hasHistoryOrExit && isQuantityIssued && item.batches) {
        const bNo = item.batches;
        if (!batchMap[bNo]) {
          batchMap[bNo] = {
            batchNo: bNo,
            issueDate: item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : 'N/A',
            issuedQty: 0,
            noOfRolls: new Set(),
            remarks: 'Direct Issue',
            matchedItems: []
          };
        }
        batchMap[bNo].issuedQty += (Number(item.initialQuantity || 0) - Number(item.currentQuantity || 0));
        batchMap[bNo].noOfRolls.add(item.rollNo || item.element || item._id);
        if (!batchMap[bNo].matchedItems.some(i => i._id === item._id)) {
          batchMap[bNo].matchedItems.push(item);
        }
      }
    });

    // Fallback if no specific batch mappings were formed
    if (Object.keys(batchMap).length === 0 && poItems.length > 0) {
      const defaultBatchNo = poItems[0].batches || 'BATCH-001';
      batchMap[defaultBatchNo] = {
        batchNo: defaultBatchNo,
        issueDate: 'N/A',
        issuedQty: poItems.reduce((acc, curr) => acc + (Number(curr.initialQuantity || 0) - Number(curr.currentQuantity || 0)), 0),
        noOfRolls: new Set(poItems.map(i => i.rollNo || i.element || i._id)),
        remarks: 'Direct Assignment',
        matchedItems: poItems
      };
    }

    const batches = Object.values(batchMap).map(b => ({
      ...b,
      noOfRolls: b.noOfRolls.size > 0 ? b.noOfRolls.size : 1
    }));

    setBatchIssueDetailsData(batches);
  };

  const handleBatchSelect = (batch) => {
    setSelectedBatch(batch);

    const batchItems = batch.matchedItems || [];
    const formattedRolls = batchItems.map(item => {
      let issuedQ = 0;
      if (Array.isArray(item.updateHistory)) {
        item.updateHistory
          .filter(h => h.batchNo === batch.batchNo)
          .forEach(h => { issuedQ += Number(h.quantityGone || 0); });
      }

      return {
        originalItem: item,
        elementId: item.rollNo || item.element,
        yarnLotNo: item.yarnLotNo || '00',
        location: item.locationName || item.locationBarcode || 'N/A',
        rollQty: Number(item.initialQuantity || item.currentQuantity || 0),
        issuedQty: issuedQ > 0 ? issuedQ : (Number(item.initialQuantity || 0) - Number(item.currentQuantity || 0)),
        issueDate: batch.issueDate,
        balanceQty: Number(item.currentQuantity || 0)
      };
    });

    setRollElementDetailsData(formattedRolls);
  };

  const handleElementRowClick = (rollData) => {
    setSelectedItemDetail(rollData.originalItem);
    setIsModalOpen(true);
  };

  const formatNumber = (val) => {
    if (typeof val === 'number' || (!isNaN(val) && val !== '' && val !== null && val !== undefined)) {
      return Number(val).toFixed(2);
    }
    return val || '0.00';
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6 bg-slate-50/50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl shadow-xs border border-slate-100">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Summary & Traceability View</h2>
          <p className="text-xs text-slate-500 mt-0.5">Track inventory across Purchase Orders, batches, and individual rolls.</p>
        </div>
        <button 
          type="button"
          onClick={fetchAllItemsData}
          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw size={14} className={loadingFilters ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Filter Panel */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-100">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-xs uppercase tracking-wider">
            <Filter size={15} className="text-cyan-600" /> Filters
          </div>
          {(selectedPackingList || selectedPoFilter || dateFrom) && (
            <button 
              type="button" 
              onClick={handleResetFilters}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 transition cursor-pointer"
            >
              Clear Filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1.5">Packing List</label>
            <div className="relative">
              <select 
                value={selectedPackingList}
                onChange={(e) => setSelectedPackingList(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-cyan-600 focus:bg-white text-xs font-medium appearance-none text-slate-700 transition"
                disabled={loadingFilters}
              >
                <option value="">All Packing Lists</option>
                {packingLists.map((pl, idx) => (
                  <option key={idx} value={pl}>{pl}</option>
                ))}
              </select>
              <ChevronRight size={14} className="absolute right-3 top-1/2 -translate-y-1/2 rotate-90 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1.5">PO Number</label>
            <div className="relative">
              <select 
                value={selectedPoFilter}
                onChange={(e) => setSelectedPoFilter(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-cyan-600 focus:bg-white text-xs font-medium appearance-none text-slate-700 transition"
                disabled={loadingFilters}
              >
                <option value="">All PO Numbers</option>
                {poNumbers.map((po, idx) => (
                  <option key={idx} value={po}>{po}</option>
                ))}
              </select>
              <ChevronRight size={14} className="absolute right-3 top-1/2 -translate-y-1/2 rotate-90 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1.5">Date From</label>
            <input 
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-cyan-600 focus:bg-white text-xs font-medium text-slate-700 transition"
            />
          </div>

          <div>
            <button 
              type="button" 
              onClick={handleApplyFilters}
              disabled={loadingSummary}
              className="w-full p-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-semibold text-xs transition shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              {loadingSummary ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />} 
              Apply Filters
            </button>
          </div>
        </div>
      </div>

      <div className="flex justify-center">
        <div className="bg-white p-1.5 rounded-full text-cyan-600 border border-slate-100 shadow-xs">
          <ArrowDown size={15} />
        </div>
      </div>

      {/* PO Summary Table */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-100 overflow-hidden">
        <div className="bg-slate-900 px-5 py-3 flex justify-between items-center text-white">
          <h3 className="font-semibold text-xs flex items-center gap-2 uppercase tracking-wider">
            <Package size={15} className="text-cyan-400" /> PO Summary
          </h3>
          <span className="text-[10px] bg-slate-800 text-slate-300 font-semibold px-2 py-0.5 rounded-md border border-slate-700">
            {selectedPackingList || 'All Records'}
          </span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                <th className="p-3.5">PO No.</th>
                <th className="p-3.5">Fabrication</th>
                <th className="p-3.5">Buyer</th>
                <th className="p-3.5 text-right">Total Qty (KG)</th>
                <th className="p-3.5 text-right">Issued Qty (KG)</th>
                <th className="p-3.5 text-right">Balance Qty (KG)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-medium">
              {loadingSummary ? (
                <tr>
                  <td colSpan="6" className="text-center py-10 text-slate-400">
                    <Loader2 size={20} className="animate-spin mx-auto mb-2 text-cyan-600" /> Loading summary...
                  </td>
                </tr>
              ) : poSummaryData.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-10 text-slate-400">No records found.</td>
                </tr>
              ) : (
                poSummaryData.map((row, idx) => {
                  const isSelected = selectedPO?.poNo === row.poNo;
                  return (
                    <tr 
                      key={idx} 
                      onClick={() => handlePoSelect(row)}
                      className={`cursor-pointer transition-colors hover:bg-cyan-50/40 ${isSelected ? 'bg-cyan-50/80 font-semibold border-l-4 border-cyan-600' : ''}`}
                    >
                      <td className="p-3.5 font-mono text-cyan-900 font-bold">{row.poNo}</td>
                      <td className="p-3.5 text-slate-800">{row.fabrication}</td>
                      <td className="p-3.5 text-slate-600">{row.buyer}</td>
                      <td className="p-3.5 text-right font-mono text-slate-700">{formatNumber(row.totalQty)}</td>
                      <td className="p-3.5 text-right font-mono text-slate-700">{formatNumber(row.issuedQty)}</td>
                      <td className="p-3.5 text-right font-mono text-rose-600 font-bold">{formatNumber(row.balanceQty)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-center">
        <div className="bg-white p-1.5 rounded-full text-cyan-600 border border-slate-100 shadow-xs">
          <ArrowDown size={15} />
        </div>
      </div>

      {/* Batch Breakdown Table */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-100 overflow-hidden">
        <div className="bg-slate-900 px-5 py-3 flex justify-between items-center text-white">
          <h3 className="font-semibold text-xs flex items-center gap-2 uppercase tracking-wider">
            <FileText size={15} className="text-cyan-400" /> Batch Breakdown {selectedPO && <span className="text-cyan-300 font-mono">({selectedPO.poNo})</span>}
          </h3>
          <span className="text-[10px] bg-slate-800 text-slate-300 font-semibold px-2 py-0.5 rounded-md border border-slate-700">
            {selectedPO ? 'Select Batch' : 'Select a PO above'}
          </span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                <th className="p-3.5">Batch No.</th>
                <th className="p-3.5">Issue Date</th>
                <th className="p-3.5 text-right">Issued Quantity (KG)</th>
                <th className="p-3.5 text-center">Rolls Issued</th>
                <th className="p-3.5">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-medium">
              {!selectedPO ? (
                <tr>
                  <td colSpan="5" className="text-center py-10 text-slate-400">Please select a PO row from above.</td>
                </tr>
              ) : batchIssueDetailsData.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-10 text-slate-400">No batch details found.</td>
                </tr>
              ) : (
                batchIssueDetailsData.map((batch, idx) => {
                  const isSelected = selectedBatch?.batchNo === batch.batchNo;
                  return (
                    <tr 
                      key={idx}
                      onClick={() => handleBatchSelect(batch)}
                      className={`cursor-pointer transition-colors hover:bg-cyan-50/40 ${isSelected ? 'bg-cyan-50/80 font-semibold border-l-4 border-cyan-600' : ''}`}
                    >
                      <td className="p-3.5 font-mono text-cyan-900 font-bold">{batch.batchNo}</td>
                      <td className="p-3.5 text-slate-600">{batch.issueDate}</td>
                      <td className="p-3.5 text-right font-mono text-slate-800">{formatNumber(batch.issuedQty)}</td>
                      <td className="p-3.5 text-center font-mono text-slate-700">{batch.noOfRolls}</td>
                      <td className="p-3.5 text-slate-600">{batch.remarks}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-center">
        <div className="bg-white p-1.5 rounded-full text-cyan-600 border border-slate-100 shadow-xs">
          <ArrowDown size={15} />
        </div>
      </div>

      {/* Barcode / Element Details Table */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-100 overflow-hidden">
        <div className="bg-slate-900 px-5 py-3 flex justify-between items-center text-white">
          <h3 className="font-semibold text-xs flex items-center gap-2 uppercase tracking-wider">
            <Layers size={15} className="text-cyan-400" /> Element Details {selectedBatch && <span className="text-cyan-300 font-mono">({selectedBatch.batchNo})</span>}
          </h3>
          <span className="text-[10px] bg-slate-800 text-slate-300 font-semibold px-2 py-0.5 rounded-md border border-slate-700">
            {selectedBatch ? 'Click row for item history' : 'Select a batch above'}
          </span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                <th className="p-3.5">Element ID / Barcode</th>
                <th className="p-3.5 text-center">Yarn Lot No</th>
                <th className="p-3.5">Location</th>
                <th className="p-3.5 text-right">Roll Qty (KG)</th>
                <th className="p-3.5 text-right">Issued Qty (KG)</th>
                <th className="p-3.5">Issue Date</th>
                <th className="p-3.5 text-right">Balance Qty (KG)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-medium">
              {!selectedBatch ? (
                <tr>
                  <td colSpan="7" className="text-center py-10 text-slate-400">Please select a batch row from above.</td>
                </tr>
              ) : rollElementDetailsData.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-10 text-slate-400">No elements found.</td>
                </tr>
              ) : (
                rollElementDetailsData.map((roll, idx) => (
                  <tr 
                    key={idx} 
                    onClick={() => handleElementRowClick(roll)}
                    className="hover:bg-cyan-50/50 transition-colors cursor-pointer group"
                  >
                    <td className="p-3.5 font-mono text-cyan-900 font-bold group-hover:underline flex items-center gap-1.5">
                      <Barcode size={14} className="text-cyan-600" /> {roll.elementId}
                    </td>
                    <td className="p-3.5 text-center font-mono text-slate-600">{roll.yarnLotNo}</td>
                    <td className="p-3.5 font-mono text-slate-600">{roll.location}</td>
                    <td className="p-3.5 text-right font-mono text-slate-800">{formatNumber(roll.rollQty)}</td>
                    <td className="p-3.5 text-right font-mono text-slate-800">{formatNumber(roll.issuedQty)}</td>
                    <td className="p-3.5 text-slate-600">{roll.issueDate}</td>
                    <td className="p-3.5 text-right font-mono text-slate-500">{formatNumber(roll.balanceQty)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Item Detail Modal */}
      {isModalOpen && selectedItemDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-150 my-8">
            <div className="bg-slate-900 px-5 py-3.5 flex justify-between items-center text-white">
              <div className="flex items-center gap-2">
                <Barcode size={18} className="text-cyan-400" />
                <div>
                  <h3 className="font-bold text-xs uppercase tracking-wider">Item Traceability History</h3>
                  <p className="text-[10px] text-cyan-300 font-mono">{selectedItemDetail.rollNo || selectedItemDetail.element}</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto text-xs">
              <div>
                <h4 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <Package size={14} className="text-cyan-600" /> General Specifications
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Buyer</span>
                    <span className="font-semibold text-slate-800">{selectedItemDetail.buyer || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">PO No.</span>
                    <span className="font-semibold text-cyan-900 font-mono">{selectedItemDetail.poNo || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Packing List</span>
                    <span className="font-semibold text-slate-800">{selectedItemDetail.packingList || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Description</span>
                    <span className="font-semibold text-slate-800">{selectedItemDetail.productDescription || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Lot / Yarn Lot</span>
                    <span className="font-semibold text-slate-800 font-mono">{selectedItemDetail.lot} / {selectedItemDetail.yarnLotNo || '00'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Location</span>
                    <span className="font-semibold text-slate-800 flex items-center gap-1">
                      <MapPin size={12} className="text-rose-500" /> {selectedItemDetail.locationName || selectedItemDetail.locationBarcode || 'Unassigned'}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <Layers size={14} className="text-cyan-600" /> Quantities & Weights
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Initial Qty</span>
                    <span className="font-mono font-semibold text-slate-800">{formatNumber(selectedItemDetail.initialQuantity)} KG</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Current Qty</span>
                    <span className="font-mono font-semibold text-rose-600">{formatNumber(selectedItemDetail.currentQuantity)} KG</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Net Weight</span>
                    <span className="font-mono font-semibold text-slate-800">{formatNumber(selectedItemDetail.netWeight)} KG</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Gross Weight</span>
                    <span className="font-mono font-semibold text-slate-800">{formatNumber(selectedItemDetail.grossWeight)} KG</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <Calendar size={14} className="text-cyan-600" /> Timestamps
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Created At</span>
                    <span className="font-medium text-slate-700">{selectedItemDetail.createdAt ? new Date(selectedItemDetail.createdAt).toLocaleString() : 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Item Entered</span>
                    <span className="font-medium text-slate-700">{selectedItemDetail.itemEntered ? new Date(selectedItemDetail.itemEntered).toLocaleString() : 'N/A'}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <Clock size={14} className="text-cyan-600" /> Issue History Log
                </h4>
                {(!selectedItemDetail.updateHistory || selectedItemDetail.updateHistory.length === 0) ? (
                  <p className="text-slate-400 italic bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-center">No history recorded.</p>
                ) : (
                  <div className="border border-slate-100 rounded-xl overflow-hidden bg-white">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 text-[10px] font-bold uppercase border-b border-slate-100">
                          <th className="p-3">Timestamp</th>
                          <th className="p-3">Batch No.</th>
                          <th className="p-3 text-right">Quantity Gone (KG)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                        {selectedItemDetail.updateHistory.map((hist, hIdx) => (
                          <tr key={hIdx} className="hover:bg-slate-50 transition">
                            <td className="p-3">{hist.timestamp ? new Date(hist.timestamp).toLocaleString() : 'N/A'}</td>
                            <td className="p-3 font-mono text-cyan-900 font-bold">{hist.batchNo || selectedItemDetail.batches || 'N/A'}</td>
                            <td className="p-3 text-right font-mono text-rose-600 font-bold">-{formatNumber(hist.quantityGone)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-slate-50 px-5 py-3 border-t border-slate-100 flex justify-end">
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition cursor-pointer shadow-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SummaryView;