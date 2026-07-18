import React, { useState } from 'react';
import { addItem } from '../api/itemService';
import BarcodeCard from '../components/BarcodeCard';
import * as XLSX from 'xlsx';

const AddItem = () => {
  const [loading, setLoading] = useState(false);
  const [createdItem, setCreatedItem] = useState(null);
  
  const [formData, setFormData] = useState({
    barcode: '', poNo: '', customer: '', qty: '', location: '',
    color: '', productDescription: '', siliconFinishQuality: '', 
    grade: '', netWeight: '', lotNo: '', rollNo: '', processType: '',
    gsm: '', grossWeight: '', actualWidth: '', finishType: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addItem(formData);
      setCreatedItem({ ...formData, date: new Date() });
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to add item');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    
    reader.onload = async (event) => {
      const data = new Uint8Array(event.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const json = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);

      setLoading(true);
      let successCount = 0;
      const userId = localStorage.getItem('userId'); 

      for (const item of json) {
        const { _id, __v, createdAt, updatedAt, date, ...cleanItem } = item;
        const payload = { ...cleanItem, createdBy: userId };

        try {
          await addItem(payload);
          successCount++;
        } catch (err) {
          console.error('Failed to add:', item.barcode, err.response?.data);
        }
      }
      
      setLoading(false);
      alert(`Upload finished. Successfully added ${successCount} items.`);
      window.location.reload();
    };
    reader.readAsArrayBuffer(file);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (createdItem) {
    return (
      <div className="max-w-2xl mx-auto mt-10 p-4 md:p-8 text-center">
        <h2 className="text-2xl font-bold mb-6">Item Added Successfully!</h2>
        <BarcodeCard key={createdItem.barcode} itemData={createdItem} />
        <button onClick={() => window.location.reload()} className="mt-6 text-cyan-600 underline">
          Add another item
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto mt-6 md:mt-10 p-4 md:p-8 bg-white rounded-lg shadow-xl border border-gray-200">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 border-b pb-4 gap-4">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800">Add New Item</h2>
        <div className="w-full md:w-auto">
          <label className="text-sm font-bold text-gray-600 block mb-1">Bulk Upload (.xlsx):</label>
          <input type="file" accept=".xlsx" onChange={handleFileUpload} className="text-sm w-full" />
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {Object.keys(formData).map((field) => (
          <div key={field}>
            <label className="block text-sm font-medium text-gray-700 capitalize mb-1">
              {field.replace(/([A-Z])/g, ' $1')}
            </label>
            <input
              type={['qty', 'netWeight', 'grossWeight', 'gsm'].includes(field) ? 'number' : 'text'}
              name={field}
              value={formData[field]}
              onChange={handleChange}
              required={!['productDescription', 'siliconFinishQuality', 'processType', 'finishType', 'actualWidth'].includes(field)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-cyan-500 outline-none"
            />
          </div>
        ))}
        <button 
          type="submit" 
          disabled={loading} 
          className="sm:col-span-2 md:col-span-3 w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 rounded-md mt-4 transition"
        >
          {loading ? 'Processing...' : 'Save & Generate Label'}
        </button>
      </form>
    </div>
  );
};

export default AddItem;