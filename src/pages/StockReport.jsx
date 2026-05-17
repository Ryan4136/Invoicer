import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import StatsCard from '@/components/ui/StatsCard';
import DataTable from '@/components/ui/DataTable';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  Package,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Search,
  Filter,
  IndianRupee
} from 'lucide-react';
import { ExportButton } from '@/components/ui/ExportImportButtons';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function StockReport() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['items'],
    queryFn: () => base44.entities.Item.list('-created_date'),
  });

  const { data: stockEntries = [] } = useQuery({
    queryKey: ['stockEntries'],
    queryFn: () => base44.entities.StockEntry.list('-created_date', 100),
  });

  // Get unique categories
  const categories = [...new Set(items.map(i => i.category).filter(Boolean))];

  // Calculate stats
  const stats = useMemo(() => {
    const totalItems = items.length;
    const totalStockValue = items.reduce((sum, item) => 
      sum + ((item.current_stock || 0) * (item.purchase_price || item.sale_price || 0)), 0);
    const lowStockItems = items.filter(item => 
      !item.is_service && item.current_stock <= item.reorder_level);
    const outOfStockItems = items.filter(item => 
      !item.is_service && item.current_stock <= 0);
    
    return {
      totalItems,
      totalStockValue,
      lowStockCount: lowStockItems.length,
      outOfStockCount: outOfStockItems.length
    };
  }, [items]);

  // Filter items
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = !searchQuery || 
        item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.code?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
      const matchesStatus = filterStatus === 'all' ||
        (filterStatus === 'low_stock' && item.current_stock <= item.reorder_level && item.current_stock > 0) ||
        (filterStatus === 'out_of_stock' && item.current_stock <= 0) ||
        (filterStatus === 'in_stock' && item.current_stock > item.reorder_level);
      return matchesSearch && matchesCategory && matchesStatus && !item.is_service;
    });
  }, [items, searchQuery, filterCategory, filterStatus]);

  // Stock by category
  const stockByCategory = useMemo(() => {
    const categoryMap = {};
    items.forEach(item => {
      if (item.is_service) return;
      const cat = item.category || 'Uncategorized';
      if (!categoryMap[cat]) {
        categoryMap[cat] = { name: cat, value: 0, count: 0 };
      }
      categoryMap[cat].value += (item.current_stock || 0) * (item.purchase_price || item.sale_price || 0);
      categoryMap[cat].count += item.current_stock || 0;
    });
    return Object.values(categoryMap).sort((a, b) => b.value - a.value).slice(0, 6);
  }, [items]);

  // Top items by value
  const topItemsByValue = useMemo(() => {
    return items
      .filter(item => !item.is_service)
      .map(item => ({
        name: item.name,
        value: (item.current_stock || 0) * (item.purchase_price || item.sale_price || 0),
        stock: item.current_stock
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [items]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const columns = [
    {
      header: 'Item',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            row.current_stock <= 0 
              ? 'bg-red-100' 
              : row.current_stock <= row.reorder_level 
              ? 'bg-amber-100' 
              : 'bg-emerald-100'
          }`}>
            <Package className={`w-5 h-5 ${
              row.current_stock <= 0 
                ? 'text-red-600' 
                : row.current_stock <= row.reorder_level 
                ? 'text-amber-600' 
                : 'text-emerald-600'
            }`} />
          </div>
          <div>
            <p className="font-medium text-[#0F1724]">{row.name}</p>
            <p className="text-xs text-gray-400">{row.code}</p>
          </div>
        </div>
      )
    },
    {
      header: 'Category',
      render: (row) => row.category ? (
        <Badge variant="secondary" className="bg-gray-100 text-gray-700">{row.category}</Badge>
      ) : '-'
    },
    {
      header: 'Current Stock',
      render: (row) => (
        <div className="text-right">
          <p className={`font-semibold ${
            row.current_stock <= 0 
              ? 'text-red-500' 
              : row.current_stock <= row.reorder_level 
              ? 'text-amber-500' 
              : 'text-[#0F1724]'
          }`}>
            {row.current_stock} {row.unit}
          </p>
          {row.current_stock <= row.reorder_level && row.current_stock > 0 && (
            <p className="text-xs text-amber-500">Low stock</p>
          )}
          {row.current_stock <= 0 && (
            <p className="text-xs text-red-500">Out of stock</p>
          )}
        </div>
      ),
      className: 'text-right'
    },
    {
      header: 'Reorder Level',
      render: (row) => (
        <p className="text-right text-gray-500">{row.reorder_level} {row.unit}</p>
      ),
      className: 'text-right'
    },
    {
      header: 'Purchase Price',
      render: (row) => (
        <p className="text-right">{formatCurrency(row.purchase_price)}</p>
      ),
      className: 'text-right'
    },
    {
      header: 'Stock Value',
      render: (row) => (
        <p className="text-right font-semibold text-emerald-600">
          {formatCurrency((row.current_stock || 0) * (row.purchase_price || row.sale_price || 0))}
        </p>
      ),
      className: 'text-right'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#0F1724]">Stock Report</h1>
          <p className="text-gray-500 mt-1">Monitor your inventory levels and stock value</p>
        </div>
        <ExportButton
          data={filteredItems}
          filename="stock_report"
          columns={[
            { header: 'Name', accessor: 'name' },
            { header: 'Code', accessor: 'code' },
            { header: 'Category', accessor: 'category' },
            { header: 'Current Stock', accessor: 'current_stock' },
            { header: 'Unit', accessor: 'unit' },
            { header: 'Reorder Level', accessor: 'reorder_level' },
            { header: 'Purchase Price', accessor: 'purchase_price' },
            { header: 'Sale Price', accessor: 'sale_price' }
          ]}
        />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Items"
          value={stats.totalItems}
          icon={Package}
          gradient="from-emerald-500 to-green-600"
        />
        <StatsCard
          title="Stock Value"
          value={formatCurrency(stats.totalStockValue)}
          icon={IndianRupee}
          gradient="from-blue-500 to-indigo-600"
        />
        <StatsCard
          title="Low Stock"
          value={stats.lowStockCount}
          icon={TrendingDown}
          subtitle="Items below reorder level"
          gradient="from-amber-500 to-orange-600"
        />
        <StatsCard
          title="Out of Stock"
          value={stats.outOfStockCount}
          icon={AlertTriangle}
          subtitle="Items need restocking"
          gradient="from-red-500 to-rose-600"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stock by Category */}
        <Card className="border-0 shadow-[0_6px_18px_rgba(15,23,36,0.06)]">
          <CardHeader>
            <CardTitle className="text-lg">Stock Value by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stockByCategory}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {stockByCategory.map((entry, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Items */}
        <Card className="border-0 shadow-[0_6px_18px_rgba(15,23,36,0.06)]">
          <CardHeader>
            <CardTitle className="text-lg">Top Items by Stock Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topItemsByValue} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                  <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-[0_6px_18px_rgba(15,23,36,0.06)]">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-[#F7F9FA] border-0"
              />
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-full md:w-48 bg-[#F7F9FA] border-0">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-48 bg-[#F7F9FA] border-0">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="in_stock">In Stock</SelectItem>
                <SelectItem value="low_stock">Low Stock</SelectItem>
                <SelectItem value="out_of_stock">Out of Stock</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stock Table */}
      <Card className="border-0 shadow-[0_6px_18px_rgba(15,23,36,0.06)]">
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={filteredItems}
            isLoading={isLoading}
            searchable={false}
            emptyMessage="No items found"
          />
        </CardContent>
      </Card>
    </div>
  );
}