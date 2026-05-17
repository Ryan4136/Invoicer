import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Upload } from 'lucide-react';

export function ExportButton({ data, filename, columns }) {
  const handleExport = () => {
    if (!data || data.length === 0) {
      alert('No data to export');
      return;
    }

    // Get column headers
    const headers = columns.map(col => col.header || col.accessor);
    
    // Build CSV content
    let csvContent = headers.join(',') + '\n';
    
    data.forEach(row => {
      const rowData = columns.map(col => {
        let value = '';
        if (col.accessor) {
          value = row[col.accessor] || '';
        } else if (col.exportValue) {
          value = col.exportValue(row) || '';
        } else {
          // Try common fields
          value = row[col.header?.toLowerCase().replace(/\s/g, '_')] || '';
        }
        // Escape commas and quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          value = `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      });
      csvContent += rowData.join(',') + '\n';
    });

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <Button variant="outline" className="border-gray-200" onClick={handleExport}>
      <Download className="w-4 h-4 mr-2" />
      Export
    </Button>
  );
}

export function ImportButton({ onImport, templateColumns, entityName }) {
  const fileInputRef = useRef(null);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      if (typeof text !== 'string') return;

      const lines = text.split('\n').filter(line => line.trim());
      if (lines.length < 2) {
        alert('CSV file is empty or has no data rows');
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s+/g, '_'));
      const records = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        const record = {};
        headers.forEach((header, idx) => {
          if (values[idx]) {
            record[header] = values[idx];
          }
        });
        if (Object.keys(record).length > 0) {
          records.push(record);
        }
      }

      if (records.length > 0) {
        onImport(records);
      } else {
        alert('No valid records found in CSV');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const downloadTemplate = () => {
    const headers = templateColumns.join(',');
    const blob = new Blob([headers + '\n'], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${entityName}_template.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept=".csv"
        className="hidden"
      />
      <Button 
        variant="outline" 
        className="border-gray-200"
        onClick={() => {
          if (confirm('Import from CSV?\n\nClick OK to select a file, or Cancel to download a template first.')) {
            fileInputRef.current?.click();
          } else {
            downloadTemplate();
          }
        }}
      >
        <Upload className="w-4 h-4 mr-2" />
        Import
      </Button>
    </>
  );
}