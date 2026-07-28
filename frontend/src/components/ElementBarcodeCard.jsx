/**
 * @file ElementBarcodeCard.jsx
 * @description React component for rendering single or multiple inventory item label cards with generated barcodes and batch PDF download functionality.
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
 * @param {Object|Array<Object>} props.itemData - Details of a single inventory item or an array of items
 * @returns {JSX.Element} The rendered BarcodeCard component
 */
const BarcodeCard = ({ itemData }) => {
  const cardRef = useRef(null);
  const containerRef = useRef(null);
  const barcodeRefs = useRef([]);

  // Normalize itemData to always be an array for uniform mapping
  const items = Array.isArray(itemData) ? itemData : (itemData ? [itemData] : []);

  // Generate Barcodes using itemData.element instead of rollNo for each item
  useEffect(() => {
    items.forEach((item, index) => {
      const el = barcodeRefs.current[index];
      if (item?.element && el) {
        el.innerHTML = "";
        try {
          JsBarcode(el, item.element, {
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
    });
  }, [items]);

  /**
   * Optimized PDF generation handler that converts single or multiple card DOM elements to images and saves them into a multi-page or single PDF file.
   */
  const generatePDF = useCallback(async () => {
    if (!containerRef.current || items.length === 0) return;
    
    try {
      const cardElements = containerRef.current.querySelectorAll('.barcode-card-item');
      if (cardElements.length === 0) return;

      const pdf = new jsPDF('landscape', 'in', [4, 2]);

      for (let i = 0; i < cardElements.length; i++) {
        const cardEl = cardElements[i];
        const canvas = await html2canvas(cardEl, { 
          scale: 3, 
          useCORS: true,
          logging: false 
        });
        
        const imgData = canvas.toDataURL('image/png');
        
        if (i > 0) {
          pdf.addPage([4, 2], 'landscape');
        }
        
        pdf.addImage(imgData, 'PNG', 0.1, 0.1, 3.8, 1.8);
      }

      const fileName = items.length === 1 
        ? `Label_Element_${items[0].element || 'N/A'}.pdf` 
        : `Labels_Batch_${items.length}_Items.pdf`;

      pdf.save(fileName);
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("Failed to generate PDF label.");
    }
  }, [items]);

  if (items.length === 0) {
    return <div className="text-center p-4 text-gray-500">No item data available</div>;
  }

  return (
    <div className="flex flex-col items-center w-full px-2 overflow-hidden">
      {/* Container with responsive scaling holding single or multiple cards */}
      <div className="w-full flex flex-col items-center overflow-x-auto py-4 gap-4" ref={containerRef}>
        {items.map((data, index) => {
          const formattedDate = data.date 
            ? new Date(data.date).toLocaleDateString() 
            : new Date().toLocaleDateString();

          return (
            <div 
              key={index}
              ref={index === 0 ? cardRef : null} 
              className="barcode-card-item w-[4in] h-[2in] p-2 border-2 border-black bg-white text-[8pt] font-sans flex flex-col justify-between shrink-0 select-none"
            >
              {/* Header Row */}
              <div className="flex justify-between border-b border-black pb-1.5 font-bold text-[9pt]">
                <span>Buyer: {data.buyer || 'N/A'}</span> 
                <span>PO: {data.poNo || 'N/A'}</span> 
              </div>
              
              {/* Main Grid */}
              <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 mt-1 flex-grow">
                <div className="col-span-2 truncate"><strong>Desc:</strong> {data.productDescription || 'N/A'}</div>
                <div><strong>Lot:</strong> {data.lot || 'N/A'}</div>
                <div><strong>Element:</strong> {data.element || 'N/A'}</div>
                <div><strong>Qty:</strong> {data.netWeight ?? 'N/A'}</div>
                <div><strong>Net Wt:</strong> {data.netWeight || 'N/A'}</div>
                <div><strong>Gross Wt:</strong> {data.grossWeight || 'N/A'}</div>
                <div><strong>Dim (LBH):</strong> {data.length || 0}x{data.breadth || 0}x{data.height || 0}</div>
                <div className="col-span-2 font-bold text-[9pt]"><strong>Roll No:</strong> {data.rollNo || 'N/A'}</div>
              </div>

              {/* Footer Barcode Section */}
              <div className="flex flex-col items-center border-t border-black pt-0.5">
                <svg ref={(el) => (barcodeRefs.current[index] = el)} className="h-6"></svg>
                <div className="flex justify-between w-full px-1 text-[7pt]">
                  <span>{data.element}</span>
                  <span>{formattedDate}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      <button 
        onClick={generatePDF} 
        className="mt-4 w-full max-w-[200px] bg-cyan-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-cyan-800 transition shadow-sm"
      >
        <Download size={16} /> Download {items.length > 1 ? `PDF (${items.length} Labels)` : 'PDF'}
      </button>
    </div>
  );
};

export default BarcodeCard;