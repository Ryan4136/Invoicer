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
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  Calendar,
  IndianRupee,
  TrendingUp,
  FileText,
  Users,
  Filter
} from 'lucide-react';
import { ExportButton } from '@/components/ui/ExportImportButtons';
import { format, startOfMonth, endOfMonth, subDays, parseISO, isWithinInterval } from 'date-fns';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function SalesReport() {
  const [dateRange, setDateRange] = useState('this_month');
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['invoices', 'sale'],
    queryFn: () => base44.entities.Invoice.filter({ invoice_type: 'sale' }, '-invoice_date'),
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: () => base44.entities.Customer.list(),
  });

  // Handle date range changes
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

  // Filter invoices by date range
  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      if (!inv.invoice_date) return false;
      const invDate = parseISO(inv.invoice_date);
      return isWithinInterval(invDate, {
        start: parseISO(startDate),
        end: parseISO(endDate)
      });
    });
  }, [invoices, startDate, endDate]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalSales = filteredInvoices.reduce((sum, inv) => sum + (inv.grand_total || 0), 0);
    const totalTax = filteredInvoices.reduce((sum, inv) => 
      sum + (inv.cgst_total || 0) + (inv.sgst_total || 0) + (inv.igst_total || 0), 0);
    const paidAmount = filteredInvoices
      .filter(inv => inv.payment_status === 'paid')
      .reduce((sum, inv) => sum + (inv.grand_total || 0), 0);
    const pendingAmount = filteredInvoices
      .filter(inv => inv.payment_status !== 'paid')
      .reduce((sum, inv) => sum + (inv.balance_due || inv.grand_total || 0), 0);
    
    return {
      totalSales,
      totalTax,
      paidAmount,
      pendingAmount,
      invoiceCount: filteredInvoices.length,
      avgInvoiceValue: filteredInvoices.length > 0 ? totalSales / filteredInvoices.length : 0
    };
  }, [filteredInvoices]);

  // Daily sales data for chart
  const dailySalesData = useMemo(() => {
    const dailyMap = {};
    filteredInvoices.forEach(inv => {
      const date = inv.invoice_date;
      if (!dailyMap[date]) {
        dailyMap[date] = { date, sales: 0, count: 0 };
      }
      dailyMap[date].sales += inv.grand_total || 0;
      dailyMap[date].count += 1;
    });
    return Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredInvoices]);

  // Top customers
  const topCustomers = useMemo(() => {
    const customerMap = {};
    filteredInvoices.forEach(inv => {
      const name = inv.customer_name || 'Walk-in';
      if (!customerMap[name]) {
        customerMap[name] = { name, total: 0, count: 0 };
      }
      customerMap[name].total += inv.grand_total || 0;
      customerMap[name].count += 1;
    });
    return Object.values(customerMap)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [filteredInvoices]);

  // Payment status breakdown
  const paymentStatusData = useMemo(() => {
    const statusMap = { paid: 0, partial: 0, unpaid: 0 };
    filteredInvoices.forEach(inv => {
      statusMap[inv.payment_status || 'unpaid'] += inv.grand_total || 0;
    });
    return [
      { name: 'Paid', value: statusMap.paid, color: '#10b981' },
      { name: 'Partial', value: statusMap.partial, color: '#f59e0b' },
      { name: 'Unpaid', value: statusMap.unpaid, color: '#ef4444' },
    ].filter(d => d.value > 0);
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
      header: 'Customer',
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
          row.payment_status === 'paid' 
            ? 'bg-emerald-100 text-emerald-700' 
            : row.payment_status === 'partial'
            ? 'bg-amber-100 text-amber-700'
            : 'bg-red-100 text-red-700'
        }>
          {row.payment_status}
        </Badge>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#0F1724]">Sales Report</h1>
          <p className="text-gray-500 mt-1">Analyze your sales performance and trends</p>
        </div>
        <ExportButton
          data={filteredInvoices}
          filename="sales_report"
          columns={[
            { header: 'Invoice No', accessor: 'invoice_no' },
            { header: 'Date', accessor: 'invoice_date' },
            { header: 'Customer', accessor: 'customer_name' },
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Sales"
          value={formatCurrency(stats.totalSales)}
          icon={IndianRupee}
          gradient="from-emerald-500 to-green-600"
        />
        <StatsCard
          title="Total Tax"
          value={formatCurrency(stats.totalTax)}
          icon={FileText}
          subtitle="GST Collected"
          gradient="from-blue-500 to-indigo-600"
        />
        <StatsCard
          title="Received"
          value={formatCurrency(stats.paidAmount)}
          icon={TrendingUp}
          gradient="from-purple-500 to-pink-600"
        />
        <StatsCard
          title="Pending"
          value={formatCurrency(stats.pendingAmount)}
          icon={Users}
          subtitle={`${filteredInvoices.filter(i => i.payment_status !== 'paid').length} invoices`}
          gradient="from-amber-500 to-orange-600"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Trend */}
        <Card className="lg:col-span-2 border-0 shadow-[0_6px_18px_rgba(15,23,36,0.06)]">
          <CardHeader>
            <CardTitle className="text-lg">Sales Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailySalesData}>
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
                    formatter={(value) => [formatCurrency(value), 'Sales']}
                    labelFormatter={(label) => format(parseISO(label), 'dd MMM yyyy')}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="sales" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    dot={{ fill: '#10b981', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Payment Status */}
        <Card className="border-0 shadow-[0_6px_18px_rgba(15,23,36,0.06)]">
          <CardHeader>
            <CardTitle className="text-lg">Payment Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {paymentStatusData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 mt-4">
              {paymentStatusData.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-xs text-gray-500">{item.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Customers */}
      <Card className="border-0 shadow-[0_6px_18px_rgba(15,23,36,0.06)]">
        <CardHeader>
          <CardTitle className="text-lg">Top Customers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topCustomers} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Bar dataKey="total" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Invoice List */}
      <Card className="border-0 shadow-[0_6px_18px_rgba(15,23,36,0.06)]">
        <CardHeader>
          <CardTitle className="text-lg">Invoice Details</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={filteredInvoices}
            isLoading={isLoading}
            searchable={false}
            emptyMessage="No invoices found for the selected period"
          />
        </CardContent>
      </Card>
    </div>
  );
}