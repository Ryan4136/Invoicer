import React, { useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

export default function InvoiceLineItem({ 
  item, 
  index, 
  onUpdate, 
  onRemove, 
  isIGST,
  items = []
}) {

  const calculateLineTotal = (line) => {
    const qty = parseFloat(line.quantity) || 0;
    const rate = parseFloat(line.rate) || 0;
    const discountPercent = parseFloat(line.discount_percent) || 0;

    const grossAmount = qty * rate;
    const discountAmount = (grossAmount * discountPercent) / 100;
    const taxableAmount = grossAmount - discountAmount;
    const gstRate = parseFloat(line.gst_rate) || 0;

    let cgst = 0, sgst = 0, igst = 0;

    if (isIGST) {
      igst = (taxableAmount * gstRate) / 100;
    } else {
      cgst = (taxableAmount * gstRate) / 200;
      sgst = (taxableAmount * gstRate) / 200;
    }

    const totalAmount = taxableAmount + cgst + sgst + igst;

    return {
      ...line,
      discount_amount: discountAmount,
      taxable_amount: taxableAmount,
      cgst_amount: cgst,
      sgst_amount: sgst,
      igst_amount: igst,
      total_amount: totalAmount
    };
  };

  const handleChange = (field, value) => {
    const updated = { ...item, [field]: value };
    onUpdate(index, calculateLineTotal(updated));
  };

  const handleItemSelect = (itemId) => {
    const selectedItem = items.find(
      i => String(i.id) === String(itemId)
    );

    if (selectedItem) {
      const updated = {
        ...item,
        item_id: selectedItem.id,
        item_name: selectedItem.name,
        hsn_code: selectedItem.hsn_code || '',
        unit: selectedItem.unit || 'PCS',
        rate: selectedItem.rate || 0,
        gst_rate: selectedItem.gst_rate || 18,
        quantity: 1
      };

      onUpdate(index, calculateLineTotal(updated));
    }
  };

  useEffect(() => {
    const recalculated = calculateLineTotal(item);

    if (
      recalculated.cgst_amount !== item.cgst_amount ||
      recalculated.sgst_amount !== item.sgst_amount ||
      recalculated.igst_amount !== item.igst_amount
    ) {
      onUpdate(index, recalculated);
    }
  }, [isIGST]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-12 gap-2 items-center p-3 bg-[#F7F9FA] rounded-lg mb-2">
      <div className="col-span-2 md:col-span-3">
        <select
          value={item.item_id || ''}
          onChange={(e) => handleItemSelect(e.target.value)}
          className="w-full h-9 px-3 rounded-md border border-gray-200 bg-white text-sm"
        >
          <option value="">Select Item</option>
         {items.map((i, idx) => (
  <option key={`${i.id}-${idx}`} value={i.id}>
    {i.name}
  </option>
))}
        </select>
      </div>

      <div className="col-span-1 md:col-span-1">
        <Input
          type="text"
          value={item.hsn_code || ''}
          onChange={(e) => handleChange('hsn_code', e.target.value)}
      className="h-10 md:h-9 text-sm bg-white"
        />
      </div>

      <div className="col-span-1 md:col-span-1">
        <Input
          type="number"
          value={item.quantity || ''}
          onChange={(e) => handleChange('quantity', e.target.value)}
          className="h-10 md:h-9 text-sm bg-white text-right"
        />
      </div>

      <div className="col-span-1 md:col-span-1">
        <Input
          type="text"
          value={item.unit || 'PCS'}
          onChange={(e) => handleChange('unit', e.target.value)}
          className="h-10 md:h-9 text-sm bg-white text-center"
        />
      </div>

      <div className="col-span-2 md:col-span-2">
        <Input
          type="number"
          value={item.rate || ''}
          onChange={(e) => handleChange('rate', e.target.value)}
          className="h-10 md:h-9 text-sm bg-white text-right"
        />
      </div>

      <div className="col-span-1 md:col-span-1">
        <Input
          type="number"
          value={item.discount_percent || ''}
          onChange={(e) => handleChange('discount_percent', e.target.value)}
          className="h-10 md:h-9 text-sm bg-white text-right"
        />
      </div>

      <div className="col-span-1 md:col-span-1">
        <select
          value={item.gst_rate ?? 18}
          onChange={(e) => handleChange('gst_rate', parseFloat(e.target.value))}
          className="w-full h-9 px-2 rounded-md border border-gray-200 bg-white text-sm"
        >
          <option value={0}>0%</option>
          <option value={5}>5%</option>
          <option value={12}>12%</option>
          <option value={18}>18%</option>
          <option value={28}>28%</option>
        </select>
      </div>

      <div className="col-span-1 md:col-span-1 text-right">
        <p className="text-sm font-semibold">
          ₹{(item.total_amount || 0).toFixed(2)}
        </p>
      </div>

      <div className="col-span-1 md:col-span-1 flex justify-end">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onRemove(index)}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}