import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import DataTable from '@/components/ui/DataTable';
import StatsCard from '@/components/ui/StatsCard';
import { ExportButton } from '@/components/ui/ExportImportButtons';
import { Package, TrendingDown, TrendingUp, AlertTriangle } from 'lucide-react';
import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns';

export default function StockStatement() {
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [selectedGodown, setSelectedGodown] = useState('all');
  const [selectedItem, setSelectedItem] = useState('all');

  const { data: items = [] } = useQuery({
    queryKey: ['items'],
    queryFn: () => base44.entities.Item.list(),
  });
  const num = (v) => Number(v || 0);


  const { data: stockEntries = [] } = useQuery({
    queryKey: ['stockEntries'],
    queryFn: () => base44.entities.StockEntry.list('-created_date'),
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.list(),
  });

  const activeCompany = companies[0];

  // Get unique godowns
  const godowns = useMemo(() => {
    const uniqueGodowns = [...new Set(stockEntries.map(e => e.godown).filter(Boolean))];
    return uniqueGodowns.length > 0 ? uniqueGodowns : ['Main'];
  }, [stockEntries]);

  // Filter entries by month
  const filteredEntries = useMemo(() => {
    const monthStart = startOfMonth(new Date(selectedMonth));
    const monthEnd = endOfMonth(new Date(selectedMonth));
    
    return stockEntries.filter(entry => {
      const entryDate = parseISO(entry.created_date);
      const dateMatch = entryDate >= monthStart && entryDate <= monthEnd;
      const godownMatch = selectedGodown === 'all' || entry.godown === selectedGodown;
      const itemMatch = selectedItem === 'all' || entry.item_id === selectedItem;
      return dateMatch && godownMatch && itemMatch;
    });
  }, [stockEntries, selectedMonth, selectedGodown, selectedItem]);

  // Calculate stock summary for each item
  const stockSummary = useMemo(() => {
    const summary = {};
    
    items.forEach(item => {
      const itemEntries = filteredEntries.filter(e => e.item_id === item.id);
      
      const opening = itemEntries
        .filter(e => e.entry_type === 'opening')
        .reduce((sum, e) => sum + (e.quantity || 0), 0);
      
      const inward = itemEntries
        .filter(e => ['purchase', 'transfer_in', 'adjustment'].includes(e.entry_type) && e.quantity > 0)
        .reduce((sum, e) => sum + (e.quantity || 0), 0);
      
      const outward = itemEntries
        .filter(e => ['sale', 'transfer_out', 'adjustment'].includes(e.entry_type) && e.quantity < 0)
        .reduce((sum, e) => sum + Math.abs(e.quantity || 0), 0);
      
      const closing = num(item.current_stock);

summary[item.id] = {
  item_id: item.id,
  item_name: item.name,
  item_code: item.code,
  unit: item.unit,
  opening_stock: num(opening || item.opening_stock),
  inward: num(inward),
  outward: num(outward),
  closing_stock: closing,
  value: closing * num(item.purchase_price),
  reorder_level: num(item.reorder_level)
};

    });
    
    return Object.values(summary).filter(s => 
      selectedItem === 'all' || s.item_id === selectedItem
    );
  }, [items, filteredEntries, selectedItem]);

  // Calculate totals
const totals = useMemo(() => ({
  totalInward: stockSummary.reduce((sum, s) => sum + num(s.inward), 0),
  totalOutward: stockSummary.reduce((sum, s) => sum + num(s.outward), 0),
  totalValue: stockSummary.reduce((sum, s) => sum + num(s.value), 0),
  lowStockItems: stockSummary.filter(s => 
    num(s.closing_stock) <= num(s.reorder_level)
  ).length
}), [stockSummary]);


  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  const columns = [
    { header: 'Item Code', accessor: 'item_code', cellClassName: 'font-mono text-xs' },
    { header: 'Item Name', accessor: 'item_name' },
    { header: 'Unit', accessor: 'unit', cellClassName: 'text-center' },
    { 
  header: 'Opening', 
  render: (row) => num(row.opening_stock).toFixed(2),
  cellClassName: 'text-right'
},

    { header: 'Inward', render: (row) => <span className="text-green-600 font-medium">{num(row.inward).toFixed(2)}</span>, cellClassName: 'text-right' },
    { header: 'Outward', render: (row) => <span className="text-red-600 font-medium">{num(row.outward).toFixed(2)}</span>, cellClassName: 'text-right' },
    { 
  header: 'Closing', 
  render: (row) => {
    const closing = num(row.closing_stock);
    const reorder = num(row.reorder_level);

    return (
      <span className={closing <= reorder ? 'text-red-600 font-bold' : 'font-medium'}>
        {closing.toFixed(2)}
      </span>
    );
  },
  cellClassName: 'text-right'
},

    { header: 'Stock Value', render: (row) => formatCurrency(row.value), cellClassName: 'text-right' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#0F1724]">Stock Statement</h1>
          <p className="text-gray-500 mt-1">Detailed stock movement report</p>
        </div>
        <div className="flex gap-3">
          <ExportButton 
            data={stockSummary} 
            filename="stock_statement" 
            columns={columns}
          />
        </div>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Month" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => {
                    const date = new Date();
                    date.setMonth(date.getMonth() - i);
                    const value = format(date, 'yyyy-MM');
                    return (
                      <SelectItem key={value} value={value}>
                        {format(date, 'MMMM yyyy')}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select value={selectedGodown} onValueChange={setSelectedGodown}>
                <SelectTrigger>
                  <SelectValue placeholder="All Godowns" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Godowns</SelectItem>
                  {godowns.map(godown => (
                    <SelectItem key={godown} value={godown}>{godown}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select value={selectedItem} onValueChange={setSelectedItem}>
                <SelectTrigger>
                  <SelectValue placeholder="All Items" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Items</SelectItem>
                  {items.map(item => (
                    <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard
          title="Total Inward"
          value={num(totals.totalInward).toFixed(2)}
          icon={TrendingUp}
          subtitle="Units received"
          gradient="from-emerald-500 to-green-600"
        />
        <StatsCard
          title="Total Outward"
          value={totals.totalOutward.toFixed(2)}
          icon={TrendingDown}
          subtitle="Units issued"
          gradient="from-blue-500 to-indigo-600"
        />
        <StatsCard
          title="Stock Value"
          value={formatCurrency(totals.totalValue)}
          icon={Package}
          subtitle="Total inventory value"
          gradient="from-purple-500 to-pink-600"
        />
        <StatsCard
          title="Low Stock Items"
          value={totals.lowStockItems}
          icon={AlertTriangle}
          subtitle="Below reorder level"
          gradient="from-amber-500 to-orange-600"
        />
      </div>

      {/* Stock Statement Table */}
      <Card className="border-0 shadow-[0_6px_18px_rgba(15,23,36,0.06)]">
        <CardHeader className="border-b border-gray-100">
          <CardTitle>Stock Movement Summary</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={stockSummary}
            searchable={false}
            emptyMessage="No stock data available"
          />
        </CardContent>
      </Card>
    </div>
  );
}