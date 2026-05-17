import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, Download, X } from "lucide-react";
import { format } from "date-fns";

export default function InvoiceDialog({ order, outlet, onClose }) {
  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const items = order.items || [];
    const itemsText = items.map(item => 
      `${item.quantity}x ${item.name}${' '.repeat(Math.max(1, 30 - (item.name?.length || 0)))}$${((item.price || 0) * (item.quantity || 0)).toFixed(2)}`
    ).join('\n');

    const invoiceText = `
======================================
           INVOICE
======================================
${outlet?.name || 'Restaurant'}
${outlet?.address || ''}
${outlet?.phone || ''}

Invoice #: ${order.order_number || 'N/A'}
Date: ${order.created_date ? format(new Date(order.created_date), 'MMM dd, yyyy HH:mm') : 'N/A'}
${order.table_number ? `Table: ${order.table_number}` : ''}
Order Type: ${order.order_type?.replace('_', ' ').toUpperCase() || 'N/A'}

--------------------------------------
ITEMS
--------------------------------------
${itemsText || 'No items'}

--------------------------------------
Subtotal:              $${(order.subtotal || 0).toFixed(2)}
Tax (${outlet?.tax_rate || 0}%):                $${(order.tax || 0).toFixed(2)}
${order.discount > 0 ? `Discount:              -$${order.discount.toFixed(2)}` : ''}
${order.tip > 0 ? `Tip:                   $${order.tip.toFixed(2)}` : ''}
--------------------------------------
TOTAL:                 $${(order.total || 0).toFixed(2)}

Payment Method: ${order.payment_method?.toUpperCase() || 'N/A'}
Status: ${order.payment_status?.toUpperCase() || 'N/A'}

--------------------------------------
Served by: ${order.served_by || 'Staff'}

Thank you for your business!
======================================
    `;

    const blob = new Blob([invoiceText], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice_${order.order_number || 'download'}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={!!order} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto print:shadow-none">
        <DialogHeader className="print:hidden">
          <DialogTitle className="flex items-center justify-between">
            Invoice
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={handlePrint}>
                <Printer className="w-4 h-4 mr-2" />
                Print
              </Button>
              <Button size="sm" variant="outline" onClick={handleDownload}>
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <Button size="sm" variant="ghost" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 p-8 bg-white">
          <div className="text-center border-b pb-6">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">{outlet?.name || 'Restaurant'}</h1>
            {outlet?.address && <p className="text-sm text-slate-600">{outlet.address}</p>}
            {outlet?.phone && <p className="text-sm text-slate-600">{outlet.phone}</p>}
            {outlet?.gstin && <p className="text-xs text-slate-600 mt-1">GSTIN: {outlet.gstin}</p>}
            {outlet?.fssai && <p className="text-xs text-slate-600">FSSAI: {outlet.fssai}</p>}
          </div>

          <div className="grid grid-cols-2 gap-6 text-sm">
            <div>
              <p className="font-semibold text-slate-900">Invoice Number:</p>
              <p className="text-slate-600">{order.order_number || 'N/A'}</p>
            </div>
            <div>
              <p className="font-semibold text-slate-900">Date & Time:</p>
              <p className="text-slate-600">
                {order.created_date ? format(new Date(order.created_date), 'MMM dd, yyyy HH:mm') : 'N/A'}
              </p>
            </div>
            <div>
              <p className="font-semibold text-slate-900">Order Type:</p>
              <p className="text-slate-600 capitalize">{order.order_type?.replace('_', ' ') || 'N/A'}</p>
            </div>
            {order.table_number && (
              <div>
                <p className="font-semibold text-slate-900">Table:</p>
                <p className="text-slate-600">{order.table_number}</p>
              </div>
            )}
            {order.customer_name && (
              <div>
                <p className="font-semibold text-slate-900">Customer:</p>
                <p className="text-slate-600">{order.customer_name}</p>
              </div>
            )}
            <div>
              <p className="font-semibold text-slate-900">Served By:</p>
              <p className="text-slate-600">{order.served_by?.split('@')[0] || 'Staff'}</p>
            </div>
          </div>

          <div className="border-t border-b py-4">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-semibold text-slate-900">Item</th>
                  <th className="text-center py-2 font-semibold text-slate-900">Qty</th>
                  <th className="text-right py-2 font-semibold text-slate-900">Price</th>
                  <th className="text-right py-2 font-semibold text-slate-900">Total</th>
                </tr>
              </thead>
              <tbody>
                {order.items && Array.isArray(order.items) && order.items.length > 0 ? (
                  order.items.map((item, idx) => (
                    <tr key={idx} className="border-b">
                      <td className="py-3 text-slate-700">
                        {item.name || 'Unknown Item'}
                        {item.special_instructions && (
                          <p className="text-xs text-slate-500 italic">Note: {item.special_instructions}</p>
                        )}
                      </td>
                      <td className="text-center text-slate-700">{item.quantity || 0}</td>
                      <td className="text-right text-slate-700">${(item.price || 0).toFixed(2)}</td>
                      <td className="text-right font-medium text-slate-900">
                        ${((item.price || 0) * (item.quantity || 0)).toFixed(2)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="text-center py-4 text-slate-400">No items</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Subtotal:</span>
              <span className="font-medium text-slate-900">${(order.subtotal || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Tax ({outlet?.tax_rate || 0}%):</span>
              <span className="font-medium text-slate-900">${(order.tax || 0).toFixed(2)}</span>
            </div>
            {(order.discount || 0) > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Discount:</span>
                <span className="font-medium text-red-600">-${order.discount.toFixed(2)}</span>
              </div>
            )}
            {(order.tip || 0) > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Tip:</span>
                <span className="font-medium text-green-600">${order.tip.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold pt-3 border-t">
              <span className="text-slate-900">TOTAL:</span>
              <span className="text-orange-600">${(order.total || 0).toFixed(2)}</span>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-lg text-sm">
            <div className="flex justify-between">
              <span className="text-slate-600">Payment Method:</span>
              <span className="font-medium text-slate-900 uppercase">{order.payment_method || 'N/A'}</span>
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-slate-600">Payment Status:</span>
              <span className={`font-medium uppercase ${
                order.payment_status === 'paid' ? 'text-green-600' : 'text-orange-600'
              }`}>
                {order.payment_status || 'N/A'}
              </span>
            </div>
          </div>

          <div className="text-center text-sm text-slate-600 pt-6 border-t">
            <p className="font-medium">Thank you for your business!</p>
            <p className="mt-2">Please come again</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}