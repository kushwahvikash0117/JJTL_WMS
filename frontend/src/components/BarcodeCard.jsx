import React, { useEffect, useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import JsBarcode from 'jsbarcode';

const BarcodeCard = ({ itemData }) => {
  const cardRef = useRef();
  const barcodeRef = useRef();

  useEffect(() => {
    if (itemData && barcodeRef.current) {
      barcodeRef.current.innerHTML = "";
      JsBarcode(barcodeRef.current, itemData.barcode, {
        format: "CODE128", width: 1.5, height: 30, displayValue: false, margin: 0
      });
    }
  }, [itemData]);

  const generatePDF = async () => {
    if (!cardRef.current) return;
    const canvas = await html2canvas(cardRef.current, { scale: 3 });
    const pdf = new jsPDF('landscape', 'in', [4, 2]);
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0.1, 0.1, 3.8, 1.8);
    pdf.save(`Label_${itemData.barcode}.pdf`);
  };

  return (
    <div className="flex flex-col items-center w-full px-2 overflow-hidden">
      {/* Container with responsive scaling */}
      <div className="w-full flex justify-center overflow-x-auto py-4">
        <div 
          ref={cardRef} 
          className="w-[4in] h-[2in] p-2 border-2 border-black bg-white text-[6pt] font-sans flex flex-col justify-between shrink-0"
        >
          <div className="flex justify-between border-b border-black pb-0.5 font-bold">
            <span>PO: {itemData.poNo}</span> <span>Cust: {itemData.customer}</span> <span>Color: {itemData.color}</span>
          </div>
          <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 mt-1 flex-grow">
            <div className="col-span-2 truncate"><strong>Desc:</strong> {itemData.productDescription}</div>
            <div className="col-span-2"><strong>Finish:</strong> {itemData.siliconFinishQuality} - {itemData.finishType}</div>
            <div><strong>Grade:</strong> {itemData.grade}</div>
            <div><strong>GSM:</strong> {itemData.gsm}</div>
            <div><strong>Net Wt:</strong> {itemData.netWeight}</div>
            <div><strong>Gross Wt:</strong> {itemData.grossWeight}</div>
            <div><strong>Lot:</strong> {itemData.lotNo}</div>
            <div><strong>Roll:</strong> {itemData.rollNo}</div>
            <div><strong>Qty:</strong> {itemData.qty}</div>
            <div><strong>Width:</strong> {itemData.actualWidth}</div>
          </div>
          <div className="flex flex-col items-center border-t border-black pt-0.5">
            <svg ref={barcodeRef} className="h-6"></svg>
            <div className="flex justify-between w-full px-1 text-[5pt]">
              <span>{itemData.barcode}</span>
              <span>{itemData.date ? new Date(itemData.date).toLocaleDateString() : ''}</span>
            </div>
          </div>
        </div>
      </div>
      
      <button 
        onClick={generatePDF} 
        className="mt-4 w-full max-w-[200px] bg-cyan-700 text-white py-3 rounded-md font-bold hover:bg-cyan-800 transition"
      >
        Download PDF Label
      </button>
    </div>
  );
};

export default BarcodeCard;