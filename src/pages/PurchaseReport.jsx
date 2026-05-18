import React, { useState, useMemo } from 'react';

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
  LineChart,
  Line
} from 'recharts';
import {
  Calendar,
  IndianRupee,
  TrendingUp,
  FileText,
  Package
} from 'lucide-react';
import { ExportButton } from '@/components/ui/ExportImportButtons';
import { format, startOfMonth, endOfMonth, subDays, parseISO, isWithinInterval } from 'date-fns';

export default function PurchaseReport() {
  const [dateRange, setDateRange] = useState('this_month');
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));

const { data: invoices = [], isLoading } = useQuery({
  queryKey: ['purchase-report', startDate, endDate],

  queryFn: async () => {

    const response = await fetch(
      `http://localhost:8000/api/purchases/list.php?report=1&start_date=${startDate}&end_date=${endDate}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch purchases');
    }

    const result = await response.json();

    return result.data || [];
  }
});

  const handleDateRangeChange = (range) => {
    setDateRange(range);
    const today = new Date();
    
    switch (range) {
      case 'today':
        setStartDate(format(today, 'yyyy-MM-dd'));
        setEndDate(format(today, 'yyyy-MM-dd'));
        break;
      case 'last_7_days':
        setStartDate(format(subDays(today, 7), 'yyyy-MM-dd'));
        setEndDate(format(today, 'yyyy-MM-dd'));
        break;
      case 'this_month':
        setStartDate(format(startOfMonth(today), 'yyyy-MM-dd'));
        setEndDate(format(endOfMonth(today), 'yyyy-MM-dd'));
        break;
      case 'last_30_days':
        setStartDate(format(subDays(today, 30), 'yyyy-MM-dd'));
        setEndDate(format(today, 'yyyy-MM-dd'));
        break;
      default:
        break;
    }
  };

const filteredInvoices = invoices;

  const stats = useMemo(() => {
    const totalPurchases = filteredInvoices.reduce((sum, inv) => sum + Number(inv.grand_total || 0), 0);
    const totalTax = filteredInvoices.reduce((sum, inv) => 
      sum + (inv.cgst_total || 0) + (inv.sgst_total || 0) + (inv.igst_total || 0), 0);
    const paidAmount = filteredInvoices
      .filter(inv => inv.payment_status === 1)
      .reduce((sum, inv) => sum + Number(inv.grand_total || 0), 0);
const pendingAmount = filteredInvoices
  .filter(inv => inv.payment_status !== 1)
  .reduce(
    (sum, inv) =>
      sum + Number(inv.balance_due || inv.grand_total || 0),
    0
  );
    
    return {
      totalPurchases,
      totalTax,
      paidAmount,
      pendingAmount,
      invoiceCount: filteredInvoices.length
    };
  }, [filteredInvoices]);

  const dailyData = useMemo(() => {
    const dailyMap = {};
    filteredInvoices.forEach(inv => {
      const date = inv.invoice_date;
      if (!dailyMap[date]) {
        dailyMap[date] = { date, purchases: 0, count: 0 };
      }
      dailyMap[date].purchases += Number(inv.grand_total || 0);
      dailyMap[date].count += 1;
    });
    return Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredInvoices]);

  const topSuppliers = useMemo(() => {
    const supplierMap = {};
    filteredInvoices.forEach(inv => {
      const name = inv.customer_name || 'Unknown';
      if (!supplierMap[name]) {
        supplierMap[name] = { name, total: 0, count: 0 };
      }
      supplierMap[name].total += Number(inv.grand_total || 0);
      supplierMap[name].count += 1;
    });
    return Object.values(supplierMap)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [filteredInvoices]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const columns = [
    {
      header: 'Invoice',
      render: (row) => (
        <div>
          <p className="font-medium text-[#0F1724]">{row.invoice_no}</p>
          <p className="text-xs text-gray-400">{format(parseISO(row.invoice_date), 'dd MMM yyyy')}</p>
        </div>
      )
    },
    {
      header: 'Supplier',
      accessor: 'customer_name'
    },
    {
      header: 'Amount',
      render: (row) => (
        <p className="font-semibold text-[#0F1724]">{formatCurrency(row.grand_total)}</p>
      ),
      className: 'text-right'
    },
    {
      header: 'Tax',
      render: (row) => (
        <p className="text-sm text-gray-500">
          {formatCurrency((row.cgst_total || 0) + (row.sgst_total || 0) + (row.igst_total || 0))}
        </p>
      ),
      className: 'text-right'
    },
    {
      header: 'Status',
      render: (row) => (
        <Badge variant="secondary" className={
          row.payment_status === 1 
            ? 'bg-emerald-100 text-emerald-700' 
            : row.payment_status === 2
            ? 'bg-amber-100 text-amber-700'
            : 'bg-red-100 text-red-700'
        }>
          {
  row.payment_status === 1
    ? 'Paid'
    : row.payment_status === 2
    ? 'Partial'
    : 'Unpaid'
}
        </Badge>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#0F1724]">Purchase Report</h1>
          <p className="text-gray-500 mt-1">Analyze your purchase trends and supplier spending</p>
        </div>
        <ExportButton
          data={filteredInvoices}
          filename="purchase_report"
          columns={[
            { header: 'Invoice No', accessor: 'invoice_no' },
            { header: 'Date', accessor: 'invoice_date' },
            { header: 'Supplier', accessor: 'customer_name' },
            { header: 'GSTIN', accessor: 'customer_gstin' },
            { header: 'Taxable Amount', accessor: 'taxable_amount' },
            { header: 'CGST', accessor: 'cgst_total' },
            { header: 'SGST', accessor: 'sgst_total' },
            { header: 'IGST', accessor: 'igst_total' },
            { header: 'Grand Total', accessor: 'grand_total' },
            { header: 'Payment Status', accessor: 'payment_status' }
          ]}
        />
      </div>

      {/* Date Filters */}
      <Card className="border-0 shadow-[0_6px_18px_rgba(15,23,36,0.06)]">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <Select value={dateRange} onValueChange={handleDateRangeChange}>
              <SelectTrigger className="w-full md:w-48 bg-[#F7F9FA] border-0">
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="last_7_days">Last 7 Days</SelectItem>
                <SelectItem value="this_month">This Month</SelectItem>
                <SelectItem value="last_30_days">Last 30 Days</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
            {dateRange === 'custom' && (
              <>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full md:w-auto bg-[#F7F9FA] border-0"
                />
                <span className="self-center text-gray-400">to</span>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full md:w-auto bg-[#F7F9FA] border-0"
                />
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Purchases"
          value={formatCurrency(stats.totalPurchases)}
          icon={IndianRupee}
          gradient="from-purple-500 to-indigo-600"
        />
        <StatsCard
          title="Input Tax"
          value={formatCurrency(stats.totalTax)}
          icon={FileText}
          subtitle="GST Paid"
          gradient="from-blue-500 to-cyan-600"
        />
        <StatsCard
          title="Paid"
          value={formatCurrency(stats.paidAmount)}
          icon={TrendingUp}
          gradient="from-emerald-500 to-green-600"
        />
        <StatsCard
          title="Pending"
          value={formatCurrency(stats.pendingAmount)}
          icon={Package}
          subtitle={`${filteredInvoices.filter(i => i.payment_status !== 1).length} invoices`}
          gradient="from-amber-500 to-orange-600"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-[0_6px_18px_rgba(15,23,36,0.06)]">
          <CardHeader>
            <CardTitle className="text-lg">Purchase Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(d) => format(parseISO(d), 'dd MMM')}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip 
                    formatter={(value) => [formatCurrency(value), 'Purchases']}
                    labelFormatter={(label) => format(parseISO(label), 'dd MMM yyyy')}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="purchases" 
                    stroke="#8b5cf6" 
                    strokeWidth={2}
                    dot={{ fill: '#8b5cf6', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-[0_6px_18px_rgba(15,23,36,0.06)]">
          <CardHeader>
            <CardTitle className="text-lg">Top Suppliers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topSuppliers} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                  <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Bar dataKey="total" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card className="border-0 shadow-[0_6px_18px_rgba(15,23,36,0.06)]">
        <CardHeader>
          <CardTitle className="text-lg">Purchase Details</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={filteredInvoices}
            isLoading={isLoading}
            searchable={false}
            emptyMessage="No purchases found for the selected period"
          />
        </CardContent>
      </Card>
    </div>
  );
}