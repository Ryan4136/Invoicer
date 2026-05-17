import React, { useState, useRef } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Upload, FileSpreadsheet, Download, AlertCircle, CheckCircle
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function ImportModal({ open, onClose, entityType, onImport, sampleData }) {
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);
  const { toast } = useToast();

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv')) {
        setError('Please upload a CSV file');
        return;
      }
      setFile(selectedFile);
      setError(null);
      parseCSV(selectedFile);
    }
  };

  const parseCSV = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      const rows = lines.slice(1, 6).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
        const row = {};
        headers.forEach((h, i) => row[h] = values[i] || '');
        return row;
      }).filter(row => Object.values(row).some(v => v));
      
      setPreviewData({ headers, rows, totalRows: lines.length - 1 });
    };
    reader.readAsText(file);
  };

  const downloadTemplate = () => {
    let csvContent = '';
    let headers = [];
    
    if (entityType === 'items') {
      headers = ['name', 'sku', 'barcode', 'hsn_code', 'category', 'brand', 'unit', 'purchase_rate', 'sale_rate', 'mrp', 'tax_rate', 'current_stock', 'reorder_level'];
      csvContent = headers.join(',') + '\n';
      csvContent += '"Laptop Dell","LAP-001","8901234567890","84713010","Electronics","Dell","PCS","45000","52000","55000","18","25","5"\n';
      csvContent += '"Wireless Mouse","ACC-001","8901234567891","84716060","Accessories","Logitech","PCS","800","1200","1299","18","50","20"';
    } else if (entityType === 'customers') {
      headers = ['name', 'gstin', 'phone', 'email', 'billing_address', 'billing_city', 'billing_state', 'billing_state_code'];
      csvContent = headers.join(',') + '\n';
      csvContent += '"ABC Enterprises","27AABCE1234L1ZP","9876543210","abc@example.com","101 Business Park","Mumbai","Maharashtra","27"\n';
    }

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${entityType}_template.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast({ title: 'Template downloaded' });
  };

  const handleImport = async () => {
    if (!previewData) return;
    setIsProcessing(true);
    
    try {
      // Parse full file
      const reader = new FileReader();
      reader.onload = async (e) => {
        const text = e.target.result;
        const lines = text.split('\n');
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        const records = lines.slice(1).map(line => {
          const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
          const row = {};
          headers.forEach((h, i) => {
            let val = values[i] || '';
            // Convert numeric fields
            if (['purchase_rate', 'sale_rate', 'mrp', 'tax_rate', 'current_stock', 'reorder_level', 'credit_limit', 'opening_balance'].includes(h)) {
              val = parseFloat(val) || 0;
            }
            row[h] = val;
          });
          return row;
        }).filter(row => row.name);

        await onImport(records);
        toast({ title: `Imported ${records.length} records successfully` });
        onClose();
      };
      reader.readAsText(file);
    } catch (err) {
      setError('Failed to import: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-emerald-600" />
            Import {entityType}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Download Template */}
          <div className="bg-blue-50 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="font-medium text-blue-900">Download Template</p>
              <p className="text-sm text-blue-700">Use our CSV template to prepare your data</p>
            </div>
            <Button variant="outline" onClick={downloadTemplate} className="gap-2">
              <Download className="h-4 w-4" />
              Template
            </Button>
          </div>

          {/* File Upload */}
          <div 
            className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-emerald-400 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <FileSpreadsheet className="h-12 w-12 mx-auto text-gray-400 mb-3" />
            {file ? (
              <div>
                <p className="font-medium text-gray-900">{file.name}</p>
                <p className="text-sm text-gray-500">{previewData?.totalRows || 0} rows</p>
              </div>
            ) : (
              <div>
                <p className="font-medium text-gray-900">Drop CSV file here or click to browse</p>
                <p className="text-sm text-gray-500">Supports .csv files</p>
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 rounded-lg p-3 flex items-center gap-2 text-red-700">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          {/* Preview */}
          {previewData && (
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-2 flex items-center justify-between">
                <span className="text-sm font-medium">Preview (first 5 rows)</span>
                <span className="text-sm text-gray-500">{previewData.totalRows} total</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      {previewData.headers.slice(0, 5).map((h, i) => (
                        <th key={i} className="px-3 py-2 text-left font-medium">{h}</th>
                      ))}
                      {previewData.headers.length > 5 && <th className="px-3 py-2">...</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.rows.map((row, i) => (
                      <tr key={i} className="border-t">
                        {previewData.headers.slice(0, 5).map((h, j) => (
                          <td key={j} className="px-3 py-2 truncate max-w-[150px]">{row[h]}</td>
                        ))}
                        {previewData.headers.length > 5 && <td className="px-3 py-2">...</td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={handleImport}
            disabled={!previewData || isProcessing}
            className="bg-gradient-to-r from-emerald-500 to-green-400"
          >
            {isProcessing ? 'Importing...' : `Import ${previewData?.totalRows || 0} Records`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}