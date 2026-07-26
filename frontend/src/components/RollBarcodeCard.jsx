/**
 * @file BarcodeCard.jsx
 * @description React component for rendering an inventory item label card with a rollNo-based barcode and PDF export.
 */

import React, { useEffect, useRef, useCallback } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import JsBarcode from 'jsbarcode';
import { Package, Download } from 'lucide-react';

/**
 * BarcodeCard Component
 * 
 * @param {Object} props - Component properties
 * @param {Object} props.itemData - Details of the inventory item used to populate the label and barcode
 * @returns {JSX.Element} The rendered BarcodeCard component
 */
const BarcodeCard = ({ itemData }) => {
  const cardRef = useRef(null);
  const barcodeRef = useRef(null);

  // Generate Barcode on itemData change based on rollNo
  useEffect(() => {
    if (itemData?.rollNo && barcodeRef.current) {
      barcodeRef.current.innerHTML = "";
      try {
        JsBarcode(barcodeRef.current, itemData.rollNo, {
          format: "CODE128", 
          width: 1.5, 
          height: 30, 
          displayValue: false, 
          margin: 0
        });
      } catch (err) {
        console.error("Barcode generation failed:", err);
      }
    }
  }, [itemData]);

  /**
   * Optimized PDF generation handler that converts the card DOM element to an image and saves it as a PDF label.
   */
  const generatePDF = useCallback(async () => {
    if (!cardRef.current || !itemData?.rollNo) return;
    
    try {
      const canvas = await html2canvas(cardRef.current, { 
        scale: 3, 
        useCORS: true,
        logging: false 
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('landscape', 'in', [4, 2]);
      pdf.addImage(imgData, 'PNG', 0.1, 0.1, 3.8, 1.8);
      pdf.save(`Label_${itemData.rollNo}.pdf`);
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("Failed to generate PDF label.");
    }
  }, [itemData]);

  if (!itemData) {
    return <div className="text-center p-4 text-gray-500">No item data available</div>;
  }

  const formattedDate = itemData.date 
    ? new Date(itemData.date).toLocaleDateString() 
    : new Date().toLocaleDateString();

  return (
    <div className="flex flex-col items-center w-full px-2 overflow-hidden">
      {/* Container with responsive scaling */}
      <div className="w-full flex justify-center overflow-x-auto py-4">
        <div 
          ref={cardRef} 
          className="w-[4in] h-[2in] p-2 border-2 border-black bg-white text-[6pt] font-sans flex flex-col justify-between shrink-0 select-none"
        >
          {/* Header Row */}
          <div className="flex justify-between border-b border-black pb-1.5 font-bold">
            <span>Buyer: {itemData.buyer || 'N/A'}</span> 
            <span>PO: {itemData.poNo || 'N/A'}</span> 
          </div>
          
          {/* Main Grid */}
          <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 mt-1 flex-grow">
            <div className="col-span-2 truncate"><strong>Desc:</strong> {itemData.productDescription || 'N/A'}</div>
            <div><strong>Lot:</strong> {itemData.lot || 'N/A'}</div>
            <div><strong>Element:</strong> {itemData.element || 'N/A'}</div>
            <div><strong>Qty:</strong> {itemData.qty ?? 'N/A'}</div>
            <div><strong>Net Wt:</strong> {itemData.netWeight || 'N/A'}</div>
            <div><strong>Gross Wt:</strong> {itemData.grossWeight || 'N/A'}</div>
            <div><strong>Dim (LBH):</strong> {itemData.length || 0}x{itemData.breadth || 0}x{itemData.height || 0}</div>
            <div className="col-span-2 font-bold"><strong>Roll No:</strong> {itemData.rollNo}</div>
          </div>

          {/* Footer Barcode Section */}
          <div className="flex flex-col items-center border-t border-black pt-0.5">
            <svg ref={barcodeRef} className="h-6"></svg>
            <div className="flex justify-between w-full px-1 text-[5pt]">
              <span>{itemData.barcode || itemData.rollNo}</span>
              <span>{formattedDate}</span>
            </div>
          </div>
        </div>
      </div>
      
      <button 
        onClick={generatePDF} 
        className="mt-4 w-full max-w-[200px] bg-cyan-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-cyan-800 transition shadow-sm"
      >
        <Download size={16} /> Download PDF
      </button>
    </div>
  );
};

export default BarcodeCard;