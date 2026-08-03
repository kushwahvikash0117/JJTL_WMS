/**
 * @file ElementBarcodeCard.jsx
 * @description React component for rendering a single inventory item label card with custom-spaced element barcode values, yarn lot no, and date moved to the top.
 */

import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

/**
 * ElementBarcodeCard Component
 * 
 * @param {Object} props - Component properties
 * @param {Object} props.itemData - Details of a single inventory item
 * @returns {JSX.Element} The rendered ElementBarcodeCard component
 */
const ElementBarcodeCard = ({ itemData }) => {
  const barcodeRef = useRef(null);

  // Use itemData directly as a single object
  const data = itemData;

  useEffect(() => {
    const el = barcodeRef.current;
    const barcodeValue = data?.element ? String(data.element) : '';
    if (barcodeValue && el) {
      el.innerHTML = "";
      try {
        JsBarcode(el, barcodeValue, {
          format: "CODE128", 
          width: 1.5, 
          height: 36, 
          displayValue: false, 
          margin: 0
        });
      } catch (err) {
        console.error("Barcode generation failed:", err);
      }
    }
  }, [data]);

  if (!data) {
    return <div className="text-center p-4 text-gray-500 font-bold">No item data available</div>;
  }

  const formattedDate = data.date 
    ? new Date(data.date).toLocaleDateString() 
    : new Date().toLocaleDateString();

  const barcodeText = data.element ? String(data.element) : '';
  const chars = barcodeText.split('');

  return (
    <div className="w-[4in] h-[2in] p-2 border-2 border-black bg-white text-[7.5pt] font-sans font-bold flex flex-col justify-between shrink-0 select-none box-border">
      {/* Header Row with Date */}
      <div className="flex justify-between items-center border-b border-black pb-1.5 text-[8.5pt]">
        <span>Buyer: {data.buyer || 'N/A'}</span> 
        <span>PO: {data.poNo || 'N/A'}</span>
        <span className="text-[7pt] font-normal">Date: {formattedDate}</span>
      </div>
      
      {/* Main Grid */}
      <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 my-auto">
        <div className="col-span-2 whitespace-normal break-words leading-tight">Desc: {data.productDescription || 'N/A'}</div>
        <div>Element: {data.element || 'N/A'}</div>
        <div>Lot: {data.lot || 'N/A'}</div>
        <div>Yarn Lot: {data.yarnLotNo || 'N/A'}</div>
        <div>Net Weight: {data.netWeight || 'N/A'}</div>
        <div>Quantity: {data.qty ?? data.currentQuantity ?? 'N/A'}</div>
        <div>Gross Weight: {data.grossWeight || 'N/A'}</div>
      </div>

      {/* Footer Barcode Section */}
      <div className="flex flex-col items-center border-t border-black pt-0.5">
        <svg ref={barcodeRef}></svg>
        <div className="flex justify-between items-center w-[calc(100%-12px)] px-1 mt-0.5">
          <div className="flex justify-between flex-grow text-[9pt] tracking-widest px-0.5">
            {chars.length > 0 ? (
              chars.map((char, charIdx) => (
                <span key={charIdx} className="inline-block text-center">{char}</span>
              ))
            ) : (
              <span>N/A</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ElementBarcodeCard;