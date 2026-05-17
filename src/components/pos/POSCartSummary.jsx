import React from 'react';

export default function InvoiceSummary({ invoice, isIGST }) {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  return (
    <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 border border-gray-100">
      <h4 className="font-semibold text-[#0F1724] mb-4">Invoice Summary</h4>
      
      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Subtotal</span>
          <span className="font-medium">{formatCurrency(invoice.subtotal)}</span>
        </div>
        
        {invoice.total_discount > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Discount</span>
            <span className="font-medium text-red-500">-{formatCurrency(invoice.total_discount)}</span>
          </div>
        )}
        
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Taxable Amount</span>
          <span className="font-medium">{formatCurrency(invoice.taxable_amount)}</span>
        </div>
        
        <div className="border-t border-dashed border-gray-200 my-2" />
        
        {isIGST ? (
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">IGST</span>
            <span className="font-medium">{formatCurrency(invoice.igst_total)}</span>
          </div>
        ) : (
          <>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">CGST</span>
              <span className="font-medium">{formatCurrency(invoice.cgst_total)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">SGST</span>
              <span className="font-medium">{formatCurrency(invoice.sgst_total)}</span>
            </div>
          </>
        )}
        
        {invoice.cess_total > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Cess</span>
            <span className="font-medium">{formatCurrency(invoice.cess_total)}</span>
          </div>
        )}
        
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Round Off</span>
          <span className="font-medium">{formatCurrency(invoice.round_off)}</span>
        </div>
        
        <div className="border-t border-gray-200 pt-3 mt-3">
          <div className="flex justify-between">
            <span className="text-lg font-semibold text-[#0F1724]">Grand Total</span>
            <span className="text-xl font-bold bg-gradient-to-r from-emerald-500 to-green-600 bg-clip-text text-transparent">
              {formatCurrency(invoice.grand_total)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}