import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileText, Download, TrendingUp, DollarSign, 
  ShoppingCart, Package, Users, Calendar 
} from "lucide-react";
import { format, startOfDay, endOfDay, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

export default function Reports() {
  const [dateRange, setDateRange] = useState({
    start: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    end: format(endOfMonth(new Date()), 'yyyy-MM-dd')
  });

  const { data: orders = [] } = useQuery({
    queryKey: ['orders'],
    queryFn: () => base44.entities.Order.list('-created_date', 1000),
    initialData: [],
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  const { data: expenses = [] } = useQuery({
    queryKey: ['expenses'],
    queryFn: () => base44.entities.Expense.list('-expense_date', 1000),
    initialData: [],
  });

  const { data: menuItems = [] } = useQuery({
    queryKey: ['menu-items'],
    queryFn: () => base44.entities.MenuItem.list(),
    initialData: [],
  });

  const { data: shifts = [] } = useQuery({
    queryKey: ['shifts'],
    queryFn: () => base44.entities.Shift.list('-shift_date', 1000),
    initialData: [],
  });

  const filterByDateRange = (items, dateField) => {
    if (!Array.isArray(items)) return [];
    
    const start = new Date(dateRange.start);
    const end = new Date(dateRange.end);
    end.setHours(23, 59, 59, 999);

    return items.filter(item => {
      if (!item || !item[dateField]) return false;
      const itemDate = new Date(item[dateField]);
      return itemDate >= start && itemDate <= end;
    });
  };

  // Include all orders with payment_status = 'paid', regardless of order status
  const paidOrders = orders.filter(o => o && o.payment_status === 'paid');
  const filteredOrders = filterByDateRange(paidOrders, 'created_date');
  const filteredExpenses = filterByDateRange(expenses.filter(e => e && e.status === 'paid'), 'expense_date');
  const filteredShifts = filterByDateRange(shifts, 'shift_date');

  // Sales Metrics
  const totalRevenue = filteredOrders.reduce((sum, o) => sum + (o?.total || 0), 0);
  const totalOrders = filteredOrders.length;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const totalTax = filteredOrders.reduce((sum, o) => sum + (o?.tax || 0), 0);
  const totalDiscount = filteredOrders.reduce((sum, o) => sum + (o?.discount || 0), 0);

  // Expense Metrics
  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + (e?.amount || 0), 0);
  const netProfit = totalRevenue - totalExpenses;

  // Labor Metrics
  const totalLaborHours = filteredShifts.reduce((sum, s) => sum + (s?.hours_worked || 0), 0);
  const totalLaborCost = filteredShifts.reduce((sum, s) => {
    const hourlyRate = 15;
    return sum + ((s?.hours_worked || 0) * hourlyRate);
  }, 0);
  const laborCostPercentage = totalRevenue > 0 ? (totalLaborCost / totalRevenue) * 100 : 0;

  // Top Selling Items
  const itemSales = {};
  filteredOrders.forEach(order => {
    if (!order?.items || !Array.isArray(order.items)) return;
    order.items.forEach(item => {
      if (!item?.name) return;
      if (!itemSales[item.name]) {
        itemSales[item.name] = { quantity: 0, revenue: 0 };
      }
      itemSales[item.name].quantity += item.quantity || 0;
      itemSales[item.name].revenue += (item.quantity || 0) * (item.price || 0);
    });
  });

  const topItems = Object.entries(itemSales)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  // Sales by Day
  const salesByDay = {};
  filteredOrders.forEach(order => {
    if (!order?.created_date) return;
    const date = format(new Date(order.created_date), 'yyyy-MM-dd');
    if (!salesByDay[date]) {
      salesByDay[date] = { date, revenue: 0, orders: 0 };
    }
    salesByDay[date].revenue += order.total || 0;
    salesByDay[date].orders += 1;
  });

  const dailySalesData = Object.values(salesByDay).sort((a, b) => 
    new Date(a.date) - new Date(b.date)
  );

  // Sales by Hour
  const salesByHour = Array.from({ length: 24 }, (_, i) => ({ 
    hour: `${i}:00`, 
    revenue: 0, 
    orders: 0 
  }));

  filteredOrders.forEach(order => {
    if (!order?.created_date) return;
    const hour = new Date(order.created_date).getHours();
    if (hour >= 0 && hour < 24) {
      salesByHour[hour].revenue += order.total || 0;
      salesByHour[hour].orders += 1;
    }
  });

  const peakHours = salesByHour
    .filter(h => h.orders > 0)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  // Expense by Category
  const expensesByCategory = {};
  filteredExpenses.forEach(expense => {
    if (!expense?.category) return;
    if (!expensesByCategory[expense.category]) {
      expensesByCategory[expense.category] = 0;
    }
    expensesByCategory[expense.category] += expense.amount || 0;
  });

  const exportToCSV = (data, filename) => {
    if (!Array.isArray(data) || data.length === 0) return;
    
    const csv = [
      Object.keys(data[0]).join(','),
      ...data.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  const setQuickRange = (range) => {
    const today = new Date();
    switch(range) {
      case 'today':
        setDateRange({
          start: format(startOfDay(today), 'yyyy-MM-dd'),
          end: format(endOfDay(today), 'yyyy-MM-dd')
        });
        break;
      case 'week':
        setDateRange({
          start: format(startOfWeek(today), 'yyyy-MM-dd'),
          end: format(endOfWeek(today), 'yyyy-MM-dd')
        });
        break;
      case 'month':
        setDateRange({
          start: format(startOfMonth(today), 'yyyy-MM-dd'),
          end: format(endOfMonth(today), 'yyyy-MM-dd')
        });
        break;
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Reports & Analytics</h1>
        <p className="text-slate-600">Comprehensive business insights and performance metrics</p>
      </div>

      {/* Date Range Filter */}
      <Card className="border-none shadow-lg">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[200px] space-y-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
              />
            </div>
            <div className="flex-1 min-w-[200px] space-y-2">
              <Label>End Date</Label>
              <Input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setQuickRange('today')}>Today</Button>
              <Button variant="outline" onClick={() => setQuickRange('week')}>This Week</Button>
              <Button variant="outline" onClick={() => setQuickRange('month')}>This Month</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="sales" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto">
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="items">Items</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="labor">Labor</TabsTrigger>
        </TabsList>

        {/* Sales Report */}
        <TabsContent value="sales" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-none shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">Total Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline justify-between">
                  <p className="text-3xl font-bold text-green-600">${totalRevenue.toFixed(2)}</p>
                  <DollarSign className="w-8 h-8 text-green-500" />
                </div>
                <p className="text-xs text-slate-500 mt-1">Net: ${netProfit.toFixed(2)}</p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">Total Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline justify-between">
                  <p className="text-3xl font-bold text-slate-900">{totalOrders}</p>
                  <ShoppingCart className="w-8 h-8 text-blue-500" />
                </div>
                <p className="text-xs text-slate-500 mt-1">Avg: ${avgOrderValue.toFixed(2)}</p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">Tax Collected</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline justify-between">
                  <p className="text-3xl font-bold text-orange-600">${totalTax.toFixed(2)}</p>
                  <FileText className="w-8 h-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">Discounts Given</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline justify-between">
                  <p className="text-3xl font-bold text-red-600">${totalDiscount.toFixed(2)}</p>
                  <TrendingUp className="w-8 h-8 text-red-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-none shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Daily Sales Trend</CardTitle>
              <Button 
                size="sm" 
                onClick={() => exportToCSV(dailySalesData, 'daily_sales')}
                disabled={dailySalesData.length === 0}
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </CardHeader>
            <CardContent>
              {dailySalesData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={dailySalesData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="date" stroke="#64748b" style={{ fontSize: '12px' }} />
                    <YAxis stroke="#64748b" style={{ fontSize: '12px' }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: 'none', 
                        borderRadius: '8px', 
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' 
                      }}
                    />
                    <Line type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={3} />
                    <Line type="monotone" dataKey="orders" stroke="#3b82f6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-slate-400">
                  No sales data for selected period
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle>Peak Hours</CardTitle>
            </CardHeader>
            <CardContent>
              {peakHours.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={peakHours}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="hour" stroke="#64748b" />
                    <YAxis stroke="#64748b" />
                    <Tooltip />
                    <Bar dataKey="revenue" fill="#f97316" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-slate-400">
                  No peak hours data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Items Report */}
        <TabsContent value="items" className="space-y-6">
          <Card className="border-none shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Top Selling Items</CardTitle>
              <Button 
                size="sm" 
                onClick={() => exportToCSV(topItems, 'top_items')}
                disabled={topItems.length === 0}
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </CardHeader>
            <CardContent>
              {topItems.length > 0 ? (
                <div className="space-y-3">
                  {topItems.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-amber-500 rounded-lg flex items-center justify-center text-white font-bold">
                          {idx + 1}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{item.name}</p>
                          <p className="text-sm text-slate-600">{item.quantity} units sold</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600 text-lg">${item.revenue.toFixed(2)}</p>
                        <p className="text-xs text-slate-500">revenue</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center text-slate-400">
                  No item sales data for selected period
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Expenses Report */}
        <TabsContent value="expenses" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-none shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">Total Expenses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline justify-between">
                  <p className="text-3xl font-bold text-red-600">${totalExpenses.toFixed(2)}</p>
                  <DollarSign className="w-8 h-8 text-red-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">Net Profit</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline justify-between">
                  <p className={`text-3xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${netProfit.toFixed(2)}
                  </p>
                  <TrendingUp className={`w-8 h-8 ${netProfit >= 0 ? 'text-green-500' : 'text-red-500'}`} />
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">Profit Margin</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline justify-between">
                  <p className="text-3xl font-bold text-blue-600">
                    {totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : 0}%
                  </p>
                  <FileText className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle>Expenses by Category</CardTitle>
            </CardHeader>
            <CardContent>
              {Object.keys(expensesByCategory).length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(expensesByCategory).map(([category, amount]) => (
                    <div key={category} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <p className="font-medium text-slate-900 capitalize">{category.replace('_', ' ')}</p>
                      <p className="font-bold text-red-600">${amount.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center text-slate-400">
                  No expense data for selected period
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Labor Report */}
        <TabsContent value="labor" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-none shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">Total Hours</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline justify-between">
                  <p className="text-3xl font-bold text-slate-900">{totalLaborHours.toFixed(1)}h</p>
                  <Calendar className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">Labor Cost</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline justify-between">
                  <p className="text-3xl font-bold text-orange-600">${totalLaborCost.toFixed(2)}</p>
                  <DollarSign className="w-8 h-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">Labor Cost %</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline justify-between">
                  <p className="text-3xl font-bold text-purple-600">{laborCostPercentage.toFixed(1)}%</p>
                  <Users className="w-8 h-8 text-purple-500" />
                </div>
                <p className="text-xs text-slate-500 mt-1">Target: 25-35%</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}