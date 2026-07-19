import React, { useState } from 'react';
import { addItem } from '../api/itemService';
import BarcodeCard from '../components/BarcodeCard';
import * as XLSX from 'xlsx';
import { Upload, PlusCircle, CheckCircle, Package } from 'lucide-react';

const generateUniqueRollNo = () => `RL-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

const AddItem = () => {
  const [loading, setLoading] = useState(false);
  const [createdItem, setCreatedItem] = useState(null);
  
  // Removed 'location' from form data
  const [formData, setFormData] = useState({
    buyer: '', poNo: '', productDescription: '', 
    lot: '', element: '', qty: '', netWeight: '', 
    grossWeight: '', length: '', breadth: '', height: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    // Payload now only sends item details and the unique rollNo
    const payload = { ...formData, rollNo: generateUniqueRollNo() };
    try {
      await addItem(payload);
      setCreatedItem({ ...payload, date: new Date() });
    } catch (err) { alert(err.response?.data?.error || 'Failed to add item'); }
    finally { setLoading(false); }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const data = new Uint8Array(event.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
      setLoading(true);
      let successCount = 0;
      for (const row of jsonData) {
        const filteredData = {};
        Object.keys(formData).forEach((key) => { if (row.hasOwnProperty(key)) filteredData[key] = row[key]; });
        if (Object.keys(filteredData).length > 0) {
          try {
            await addItem({ ...filteredData, rollNo: generateUniqueRollNo() });
            successCount++;
          } catch (err) { console.error('Bulk upload error', err); }
        }
      }
      setLoading(false);
      alert(`Bulk upload complete. ${successCount} items added.`);
      window.location.reload();
    };
    reader.readAsArrayBuffer(file);
  };

  if (createdItem) {
    return (
      <div className="max-w-lg mx-auto mt-20 p-8 bg-white rounded-3xl shadow-sm border border-gray-100 text-center">
        <CheckCircle size={48} className="text-emerald-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Item Created!</h2>
        <p className="text-gray-500 mb-6">Barcode label (Roll No) is ready to print.</p>
        <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
          <BarcodeCard itemData={createdItem} />
        </div>
        <button onClick={() => window.location.reload()} className="mt-8 text-cyan-600 font-bold hover:underline">Add another item</button>
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
        
        <label className="flex items-center gap-2 bg-white px-5 py-3 rounded-2xl border border-gray-200 cursor-pointer hover:border-cyan-500 hover:text-cyan-600 transition-all shadow-sm">
          <Upload size={18} /> <span className="font-semibold text-sm">Bulk Upload (.xlsx)</span>
          <input type="file" accept=".xlsx" onChange={handleFileUpload} className="hidden" />
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
                type={['qty', 'netWeight', 'grossWeight', 'length', 'breadth', 'height'].includes(field) ? 'number' : 'text'}
                name={field}
                value={formData[field]}
                onChange={(e) => setFormData({...formData, [field]: e.target.value})}
                required
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 outline-none transition-all"
              />
            </div>
          ))}
        </div>
        <button type="submit" disabled={loading} className="w-full mt-8 bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-4 rounded-2xl transition shadow-lg shadow-cyan-600/20 flex items-center justify-center gap-2">
          {loading ? 'Generating Roll No...' : <><PlusCircle size={20}/> Save & Generate Roll No</>}
        </button>
      </form>
    </div>
  );
};

export default AddItem;