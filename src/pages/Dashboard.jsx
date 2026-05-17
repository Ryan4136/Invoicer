import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useState } from 'react';
import {
  IndianRupee, ShoppingCart, Package, Users, TrendingUp,
  AlertTriangle, ArrowRight, FileText, BarChart3, Plus, Truck
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0);

export default function Dashboard() {
 const { data: invoices = [], isLoading: loadingInvoices } = useQuery({
  queryKey: ['orders'],
  queryFn: async () => {
    const res = await fetch('http://localhost:8000/api/orders/list.php', {
      credentials: 'include'
    });
    const json = await res.json();
return json.data || [];
  }
});

const { data: items = [], isLoading: loadingItems } = useQuery({
  queryKey: ['products'],
  queryFn: async () => {
    const res = await fetch('http://localhost:8000/api/products/list.php', {
      credentials: 'include'
    });
    const json = await res.json();
    return (Array.isArray(json) ? json : []).map(p => ({
  id: Number(p.id),
  name: p.name,
  current_stock: Number(p.current_stock || 0),
  sale_price: Number(p.sale_price || 0),
  category: Number(p.category),
  is_active: Number(p.is_active) === 1
}));
  }
});

const { data: categories = [] } = useQuery({
  queryKey: ['categories'],
  queryFn: async () => {
    const res = await fetch('http://localhost:8000/api/categories/list.php', {
      credentials: 'include'
    });
    const json = await res.json();
    return Array.isArray(json) ? json : [];
  }
});

const { data: customers = [] } = useQuery({
  queryKey: ['customers'],
  queryFn: async () => {
    const res = await fetch('http://localhost:8000/api/customers/list.php', {
      credentials: 'include'
    });
    const json = await res.json();
    return Array.isArray(json) ? json : [];
  }
});
const [range, setRange] = useState('7d');

  const isLoading = loadingInvoices || loadingItems;

  const today = format(new Date(), 'yyyy-MM-dd');

  const saleInvoices = invoices; // all orders = sales
 const todaySales = invoices
  .filter(inv => inv.order_date === today)
  .reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0);
  const totalSales = invoices.reduce(
  (sum, inv) => sum + Number(inv.total_amount || 0),
  0
);
  const pendingPayments = invoices
  .filter(i => Number(i.payment_status) === 0)
  .reduce((sum, i) => sum + Number(i.due || 0), 0);
  const lowStockItems = items.filter(item => item.current_stock <= 20);


  const getDaysFromRange = (range) => {
  switch (range) {
    case '7d': return 7;
    case '1m': return 30;
    case '3m': return 90;
    case '1y': return 365;
    default: return 7;
  }
};
  // Sales chart - last 7 days
// Sales chart (dynamic range)
const days = getDaysFromRange(range);

// Pre-group sales (fast)
const salesMap = {};
saleInvoices.forEach(inv => {
  const key = inv.order_date;
  salesMap[key] = (salesMap[key] || 0) + Number(inv.total_amount || 0);
});

// Build chart data
const salesChart = Array.from({ length: days }, (_, i) => {
  const date = subDays(new Date(), days - 1 - i);
  const dateStr = format(date, 'yyyy-MM-dd');

  return {
    date: format(date, days > 30 ? 'MMM yy' : 'dd MMM'),
    sales: salesMap[dateStr] || 0,
  };
});
  // Category distribution by item count

const categoryData = categories
  .filter(c => c.itemCount > 0)
  .map(cat => ({
    name: cat.name || `Category ${cat.id}`,
    value: Number(cat.totalValue || 0)
  }));

  // Top items by stock value
  const topProducts = [...items]
    .map(item => ({ name: item.name, value: (item.current_stock || 0) * (item.sale_price || 0) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const recentInvoices = invoices.slice(0, 5);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
        </div>
      </div>
    );
  }

  const getStatus = (s) => {
  if (Number(s) === 1) return 'paid';
  if (Number(s) === 2) return 'partial';
  return 'unpaid';
};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#0F1724]">Dashboard</h1>
          <p className="text-gray-500 mt-1">Welcome back! Here's your business overview.</p>
        </div>
        <div className="flex gap-3">
          <Link to={createPageUrl('POS')}>
            <Button className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 shadow-lg shadow-emerald-500/20">
              <Plus className="w-4 h-4 mr-2" /> Quick Sale
            </Button>
          </Link>
          <Link to={createPageUrl('SalesInvoice')}>
            <Button variant="outline" className="border-gray-200">
              <FileText className="w-4 h-4 mr-2" /> New Invoice
            </Button>
          </Link>
        </div>
      </div>

      {/* Primary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: "Today's Sales", value: formatCurrency(todaySales), icon: IndianRupee, iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600' },
          { title: 'Total Sales', value: formatCurrency(totalSales), icon: TrendingUp, iconBg: 'bg-indigo-100', iconColor: 'text-indigo-600' },
          { title: 'Total Products', value: items.filter(i => i.is_active !== false).length, icon: Package, iconBg: 'bg-violet-100', iconColor: 'text-violet-600' },
          { title: 'Low Stock Items', value: lowStockItems.length, icon: AlertTriangle, iconBg: lowStockItems.length > 0 ? 'bg-rose-100' : 'bg-slate-100', iconColor: lowStockItems.length > 0 ? 'text-rose-600' : 'text-slate-600' },
        ].map(({ title, value, icon: Icon, iconBg, iconColor }) => (
          <Card key={title} className="border-0 shadow-[0_6px_18px_rgba(15,23,36,0.06)]">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${iconBg}`}>
                  <Icon className={`w-5 h-5 ${iconColor}`} />
                </div>
                <div>
                  <p className="text-sm text-gray-500">{title}</p>
                  <p className="text-xl font-bold text-[#0F1724] mt-0.5">{value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { title: 'Pending Payments', value: formatCurrency(pendingPayments), icon: IndianRupee, iconBg: 'bg-amber-100', iconColor: 'text-amber-600' },
          { title: 'Total Customers', value: customers.length, icon: Users, iconBg: 'bg-blue-100', iconColor: 'text-blue-600' },
          { title: 'Unpaid Invoices', value: invoices.filter(i => Number(i.payment_status) === 0).length, icon: Truck, iconBg: 'bg-orange-100', iconColor: 'text-orange-600' },
        ].map(({ title, value, icon: Icon, iconBg, iconColor }) => (
          <Card key={title} className="border-0 shadow-[0_6px_18px_rgba(15,23,36,0.06)]">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${iconBg}`}>
                  <Icon className={`w-5 h-5 ${iconColor}`} />
                </div>
                <div>
                  <p className="text-sm text-gray-500">{title}</p>
                  <p className="text-xl font-bold text-[#0F1724] mt-0.5">{value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Chart */}
        <Card className="border-0 shadow-[0_6px_18px_rgba(15,23,36,0.06)]">
          <CardHeader className="flex flex-row items-center justify-between">
  <CardTitle className="text-lg font-semibold">
    Sales Overview
  </CardTitle>

  <div className="flex gap-2">
    {[
      { label: '7D', value: '7d' },
      { label: '1M', value: '1m' },
      { label: '3M', value: '3m' },
      { label: '1Y', value: '1y' },
    ].map(btn => (
      <Button
        key={btn.value}
        size="sm"
        variant={range === btn.value ? 'default' : 'outline'}
        onClick={() => setRange(btn.value)}
      >
        {btn.label}
      </Button>
    ))}
  </div>
</CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesChart}>
                  <defs>
                    <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(v) => `₹${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`} />
                  <Tooltip
                    formatter={(value) => [formatCurrency(value), 'Sales']}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                  />
                  <Area type="monotone" dataKey="sales" stroke="#6366f1" strokeWidth={2} fill="url(#salesGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Category Distribution */}
        <Card className="border-0 shadow-[0_6px_18px_rgba(15,23,36,0.06)]">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Stock by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 flex items-center justify-center">
              {categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={categoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value">
                      {categoryData.map((_, index) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [formatCurrency(value), 'Value']} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-400">No data available</p>
              )}
            </div>
            <div className="flex flex-wrap gap-3 justify-center mt-2">
              {categoryData.map((cat, i) => (
                <div key={`${cat.name}-${i}`} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-xs text-gray-500">{cat.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Invoices */}
        <Card className="lg:col-span-2 border-0 shadow-[0_6px_18px_rgba(15,23,36,0.06)]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold">Recent Invoices</CardTitle>
            <Link to={createPageUrl('SalesReport')}>
              <Button variant="ghost" size="sm" className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50">
                View All <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentInvoices.length === 0 ? (
                <p className="text-center text-gray-400 py-8">No invoices yet</p>
              ) : recentInvoices.map(invoice => (
                <div key={invoice.order_id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-medium text-[#0F1724]">{invoice.invoice_no}</p>
                    <p className="text-sm text-gray-500">
                      {invoice.client_name || 'Walk-in'} • {invoice.order_date}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-emerald-600">{formatCurrency(invoice.grand_total)}</p>
                    {(() => {
  const status = getStatus(invoice.payment_status);

  return (
    <Badge className={`text-xs mt-0.5 ${
      status === 'paid'
        ? 'bg-emerald-100 text-emerald-700'
        : status === 'partial'
        ? 'bg-amber-100 text-amber-700'
        : 'bg-red-100 text-red-700'
    }`}>
      {status}
    </Badge>
  );
})()}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Low Stock Alert */}
        <Card className="border-0 shadow-[0_6px_18px_rgba(15,23,36,0.06)]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Low Stock
            </CardTitle>
            <Link to={createPageUrl('Items')}>
              <Button variant="ghost" size="sm" className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50">
                View All
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {lowStockItems.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">All items well stocked</p>
                </div>
              ) : lowStockItems.slice(0, 5).map(item => (
                <div key={`low-${item.id}`} className="flex items-center justify-between p-3 bg-rose-50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm text-[#0F1724]">{item.name}</p>
                    <p className="text-xs text-gray-400">ID: {item.id}</p>
                  </div>
                  <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100">
                    {item.current_stock}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Products Bar Chart */}
      <Card className="border-0 shadow-[0_6px_18px_rgba(15,23,36,0.06)]">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Top Products by Stock Value</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            {topProducts.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProducts} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" stroke="#94a3b8" fontSize={12} tickFormatter={(v) => `₹${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`} />
                  <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={11} width={130} />
                  <Tooltip formatter={(value) => [formatCurrency(value), 'Stock Value']} />
                  <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">No data available</div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="border-0 shadow-[0_6px_18px_rgba(15,23,36,0.06)]">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[
              { name: 'POS Sale', icon: ShoppingCart, page: 'POS', gradient: 'from-emerald-500 to-green-600' },
              { name: 'New Invoice', icon: FileText, page: 'SalesInvoice', gradient: 'from-indigo-500 to-indigo-600' },
              { name: 'Add Item', icon: Package, page: 'Items', gradient: 'from-violet-500 to-purple-600' },
              { name: 'Add Customer', icon: Users, page: 'Customers', gradient: 'from-blue-500 to-blue-600' },
              { name: 'Receive Payment', icon: IndianRupee, page: 'Receipts', gradient: 'from-amber-500 to-orange-500' },
              { name: 'Reports', icon: BarChart3, page: 'SalesReport', gradient: 'from-rose-500 to-red-600' },
            ].map(action => (
              <Link key={action.page} to={createPageUrl(action.page)}>
                <div className="p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-all hover:shadow-md cursor-pointer group">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.gradient} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-lg`}>
                    <action.icon className="w-6 h-6 text-white" />
                  </div>
                  <p className="font-medium text-[#0F1724] text-sm">{action.name}</p>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}