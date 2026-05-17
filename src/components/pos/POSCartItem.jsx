import React from 'react';
import { Button } from "@/components/ui/button";
import { Plus, Minus, Trash2 } from "lucide-react";

export default function POSCartItem({ item, onQuantityChange, onRemove }) {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount || 0);
  };

  return (
    <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100 hover:border-emerald-200 transition-colors group">
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-[#0F1724] truncate">{item.item_name}</h4>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-gray-400">{item.item_code}</span>
          <span className="text-xs text-emerald-600 font-medium">₹{formatCurrency(item.rate)}</span>
          {item.gst_rate > 0 && (
            <span className="text-xs text-gray-400">+{item.gst_rate}% GST</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 border-gray-200 hover:border-emerald-300 hover:bg-emerald-50"
          onClick={() => onQuantityChange(item.quantity - 1)}
          disabled={item.quantity <= 1}
        >
          <Minus className="w-3 h-3" />
        </Button>
        <span className="w-10 text-center font-semibold text-[#0F1724]">
          {item.quantity}
        </span>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 border-gray-200 hover:border-emerald-300 hover:bg-emerald-50"
          onClick={() => onQuantityChange(item.quantity + 1)}
        >
          <Plus className="w-3 h-3" />
        </Button>
      </div>

      <div className="text-right min-w-[80px]">
        <p className="font-semibold text-[#0F1724]">₹{formatCurrency(item.total_amount)}</p>
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-gray-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={onRemove}
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );
}