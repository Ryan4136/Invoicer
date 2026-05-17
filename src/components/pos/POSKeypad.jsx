import React from 'react';
import { Button } from "@/components/ui/button";
import { 
  CreditCard, 
  Banknote, 
  Smartphone, 
  Building2,
  Percent,
  X,
  Delete
} from "lucide-react";

export default function POSKeypad({ 
  onNumberClick, 
  onPaymentModeSelect, 
  onDiscount,
  onClear,
  onBackspace,
  selectedMode = 'cash'
}) {
  const numbers = ['7', '8', '9', '4', '5', '6', '1', '2', '3', '0', '00', '.'];
  
  const paymentModes = [
    { key: 'cash', icon: Banknote, label: 'Cash', shortcut: 'F5' },
    { key: 'card', icon: CreditCard, label: 'Card', shortcut: 'F6' },
    { key: 'upi', icon: Smartphone, label: 'UPI', shortcut: 'F7' },
    { key: 'bank', icon: Building2, label: 'Bank', shortcut: 'F8' },
  ];

  return (
    <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-[0_6px_18px_rgba(15,23,36,0.04)]">
      {/* Payment Mode Selection */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {paymentModes.map(mode => (
          <Button
            key={mode.key}
            variant={selectedMode === mode.key ? "default" : "outline"}
            onClick={() => onPaymentModeSelect(mode.key)}
            className={`flex flex-col h-auto py-3 ${
              selectedMode === mode.key 
                ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white border-0' 
                : 'border-gray-200 hover:border-emerald-300 hover:bg-emerald-50'
            }`}
          >
            <mode.icon className="w-5 h-5 mb-1" />
            <span className="text-xs">{mode.label}</span>
            <span className="text-[10px] opacity-60">{mode.shortcut}</span>
          </Button>
        ))}
      </div>

      {/* Number Pad */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {numbers.map(num => (
          <Button
            key={num}
            variant="outline"
            onClick={() => onNumberClick(num)}
            className="h-14 text-xl font-semibold border-gray-200 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-600 transition-all"
          >
            {num}
          </Button>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-3 gap-2">
        <Button
          variant="outline"
          onClick={onClear}
          className="h-12 border-red-200 text-red-500 hover:bg-red-50 hover:border-red-300"
        >
          <X className="w-5 h-5 mr-1" />
          Clear
        </Button>
        <Button
          variant="outline"
          onClick={onBackspace}
          className="h-12 border-gray-200 hover:bg-gray-50"
        >
          <Delete className="w-5 h-5 mr-1" />
          Back
        </Button>
        <Button
          variant="outline"
          onClick={onDiscount}
          className="h-12 border-amber-200 text-amber-600 hover:bg-amber-50 hover:border-amber-300"
        >
          <Percent className="w-5 h-5 mr-1" />
          Disc
        </Button>
      </div>

      {/* Keyboard Shortcuts Reference */}
      <div className="mt-4 p-3 bg-[#F7F9FA] rounded-lg">
        <p className="text-xs font-medium text-gray-500 mb-2">Quick Keys</p>
        <div className="grid grid-cols-2 gap-1 text-xs text-gray-400">
          <span>F1: New Invoice</span>
          <span>F2: Search Item</span>
          <span>F3: Search Customer</span>
          <span>F4: Hold Invoice</span>
          <span>F9: Print</span>
          <span>F10: Save & Print</span>
          <span>F11: Settings</span>
          <span>F12: Clear All</span>
        </div>
      </div>
    </div>
  );
}