/**
 * @file AddItem.jsx
 * @description React component for adding new inventory items manually or via bulk spreadsheet uploads, with label preview support and toast notifications.
 */

import React, { useState } from 'react';
import { addItem } from '../api/itemService';
import RollBarcodeCard from '../components/RollBarcodeCard';
import ElementBarcodeCard from '../components/ElementBarcodeCard';
import * as XLSX from 'xlsx';
import { Upload, PlusCircle, CheckCircle, Package } from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * Generates a unique roll number string using the current timestamp and a random suffix.
 * 
 * @returns {string} Unique roll identifier
 */
const generateUniqueRollNo = () => `RL-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

/**
 * AddItem Component
 * 
 * @returns {JSX.Element} The rendered AddItem component
 */
const AddItem = () => {
  const [loading, setLoading] = useState(false);
  const [createdItem, setCreatedItem] = useState(null);
  const [bulkProgress, setBulkProgress] = useState(null);
  
  // Toggle state to view either Roll No or Element barcode card option after creation
  const [cardType, setCardType] = useState('roll'); 
  
  const [formData, setFormData] = useState({
    buyer: '', poNo: '', productDescription: '', 
    lot: '', element: '', currentQuantity: '', netWeight: '', 
    grossWeight: '', length: '', breadth: '', height: ''
  });

  /**
   * Handles individual item form submission.
   * 
   * @param {React.FormEvent} e - Form submission event
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const payload = { ...formData, rollNo: generateUniqueRollNo() };
    try {
      await addItem(payload);
      toast.success('Item added successfully!');
      setCreatedItem({ ...payload, date: new Date() });
    } catch (err) { 
      toast.error(err.response?.data?.error || 'Failed to add item'); 
    } finally { 
      setLoading(false); 
    }
  };

  /**
   * Handles bulk spreadsheet file upload (.xlsx) for multi-item inventory ingestion with robust validation.
   * 
   * @param {React.ChangeEvent<HTMLInputElement>} e - File input change event
   */
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
          toast.error("The uploaded Excel file contains no sheets.");
          return;
        }

        const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);

        if (!jsonData || jsonData.length === 0) {
          toast.error("The spreadsheet is empty.");
          return;
        }

        setLoading(true);
        setBulkProgress({ current: 0, total: jsonData.length });
        
        let successCount = 0;
        let failCount = 0;

        for (let i = 0; i < jsonData.length; i++) {
          const row = jsonData[i];
          const filteredData = {};
          
          Object.keys(formData).forEach((key) => { 
            // Handle mapping if spreadsheet uses 'qty' or 'currentQuantity'
            const sourceKey = (key === 'currentQuantity' && !row.hasOwnProperty('currentQuantity') && row.hasOwnProperty('qty')) ? 'qty' : key;
            
            if (row.hasOwnProperty(sourceKey) && row[sourceKey] !== null && row[sourceKey] !== undefined && String(row[sourceKey]).trim() !== '') {
              filteredData[key] = row[sourceKey]; 
            } 
          });

          if (Object.keys(filteredData).length > 0) {
            try {
              await addItem({ ...filteredData, rollNo: generateUniqueRollNo() });
              successCount++;
            } catch (err) { 
              console.error(`Bulk upload error at row ${i + 2}:`, err); 
              failCount++;
            }
          } else {
            failCount++;
          }

          setBulkProgress({ current: i + 1, total: jsonData.length });
        }

        setLoading(false);
        setBulkProgress(null);
        toast.success(`Bulk upload complete! Added: ${successCount}, Failed/Skipped: ${failCount}`);
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } catch (error) {
        console.error("Error parsing spreadsheet:", error);
        toast.error("Failed to parse the Excel file. Please ensure it is a valid .xlsx format.");
        setLoading(false);
        setBulkProgress(null);
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  if (createdItem) {
    return (
      <div className="max-w-lg mx-auto mt-12 p-6 md:p-8 bg-white rounded-3xl shadow-sm border border-gray-100 text-center">
        <CheckCircle size={48} className="text-emerald-500 mx-auto mb-3" />
        <h2 className="text-2xl font-bold mb-1">Item Created!</h2>
        <p className="text-gray-500 text-sm mb-6">Choose label format to print or download.</p>
        
        {/* Card Format Toggles */}
        <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
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
            <RollBarcodeCard itemData={createdItem} />
          ) : (
            <ElementBarcodeCard itemData={createdItem} />
          )}
        </div>

        <button onClick={() => window.location.reload()} className="mt-6 text-cyan-600 font-bold hover:underline text-sm">
          Add another item
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900 flex items-center gap-3">
            <Package className="text-cyan-600" /> New Inventory Entry
          </h2>
          <p className="text-gray-500 mt-1">Register new stock. Location assignment happens during Scan.</p>
        </div>
        
        <label className={`flex items-center gap-2 bg-white px-5 py-3 rounded-2xl border border-gray-200 shadow-sm transition-all ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-cyan-500 hover:text-cyan-600'}`}>
          <Upload size={18} /> 
          <span className="font-semibold text-sm">
            {bulkProgress ? `Uploading (${bulkProgress.current}/${bulkProgress.total})...` : 'Bulk Upload (.xlsx)'}
          </span>
          <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} disabled={loading} className="hidden" />
        </label>
      </div>
      
      <form onSubmit={handleSubmit} className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {Object.keys(formData).map((field) => (
            <div key={field} className="flex flex-col">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                {field.replace(/([A-Z])/g, ' $1')}
              </label>
              <input
                type={['currentQuantity', 'netWeight', 'grossWeight', 'length', 'breadth', 'height'].includes(field) ? 'number' : 'text'}
                step={['currentQuantity'].includes(field) ? 'any' : '0.01'}
                name={field}
                value={formData[field]}
                onChange={(e) => setFormData({...formData, [field]: e.target.value})}
                required
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 outline-none transition-all"
              />
            </div>
          ))}
        </div>
        <button type="submit" disabled={loading} className="w-full mt-8 bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-4 rounded-2xl transition shadow-lg shadow-cyan-600/20 flex items-center justify-center gap-2 disabled:opacity-50">
          {loading ? 'Processing...' : <><PlusCircle size={20}/> Save & Generate Labels</>}
        </button>
      </form>
    </div>
  );
};

export default AddItem;