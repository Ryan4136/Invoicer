import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Calendar, DollarSign, User, MapPin, Eye, Printer } from "lucide-react";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import InvoiceDialog from "../components/InvoiceDialog";

export default function Orders() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [invoiceOrder, setInvoiceOrder] = useState(null);

  const { data: orders = [] } = useQuery({
    queryKey: ['orders'],
    queryFn: () => base44.entities.Order.list('-created_date', 100),
  });

  const { data: outlets = [] } = useQuery({
    queryKey: ['outlets'],
    queryFn: () => base44.entities.Outlet.list(),
  });

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.order_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.table_number?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    const colors = {
      draft: 'bg-slate-100 text-slate-700',
      pending: 'bg-yellow-100 text-yellow-700',
      preparing: 'bg-blue-100 text-blue-700',
      ready: 'bg-purple-100 text-purple-700',
      completed: 'bg-green-100 text-green-700',
      cancelled: 'bg-red-100 text-red-700'
    };
    return colors[status] || colors.draft;
  };

  const totalRevenue = orders.filter(o => o.status === 'completed').reduce((sum, o) => sum + (o.total || 0), 0);
  const todayOrders = orders.filter(o => {
    const orderDate = new Date(o.created_date);
    const today = new Date();
    return orderDate.toDateString() === today.toDateString();
  });

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Orders</h1>
        <p className="text-slate-600">View and manage all orders</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-slate-900">{orders.length}</p>
            <p className="text-sm text-slate-500 mt-1">{todayOrders.length} today</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">${totalRevenue.toFixed(2)}</p>
            <p className="text-sm text-slate-500 mt-1">Completed orders</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Active Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-600">
              {orders.filter(o => ['pending', 'preparing', 'ready'].includes(o.status)).length}
            </p>
            <p className="text-sm text-slate-500 mt-1">In progress</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-none shadow-lg">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                placeholder="Search by order number, customer, or table..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="preparing">Preparing</SelectItem>
                <SelectItem value="ready">Ready</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.map(order => (
          <Card key={order.id} className="border-none shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-amber-500 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                    #{order.order_number?.slice(-4) || 'N/A'}
                  </div>
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-slate-900 text-lg">
                        {order.customer_name || 'Walk-in Customer'}
                      </h3>
                      <Badge className={getStatusColor(order.status)}>
                        {order.status}
                      </Badge>
                      <Badge variant="outline" className="capitalize">
                        {order.order_type?.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-600">
                      {order.table_number && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          Table {order.table_number}
                        </div>
                      )}
                      {order.customer_phone && (
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {order.customer_phone}
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {format(new Date(order.created_date), 'MMM d, yyyy h:mm a')}
                      </div>
                    </div>
                    <div className="mt-2">
                      <p className="text-sm text-slate-600 font-medium">Items:</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {order.items?.map((item, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {item.quantity}x {item.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-right space-y-3">
                  <div>
                    <div className="flex items-center gap-2 text-2xl font-bold text-slate-900">
                      <DollarSign className="w-6 h-6 text-green-600" />
                      {(order.total || 0).toFixed(2)}
                    </div>
                    <p className="text-sm text-slate-600 capitalize mt-1">
                      {order.payment_method} • {order.payment_status}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      By: {order.served_by?.split('@')[0] || 'System'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedOrder(order)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Details
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setInvoiceOrder(order)}
                    >
                      <Printer className="w-4 h-4 mr-2" />
                      Invoice
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredOrders.length === 0 && (
        <Card className="border-none shadow-lg">
          <CardContent className="p-12 text-center">
            <p className="text-slate-400 text-lg">No orders found</p>
          </CardContent>
        </Card>
      )}

      {/* Order Details Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order Details - #{selectedOrder?.order_number}</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-semibold text-slate-900">Order Type:</p>
                  <p className="text-slate-600 capitalize">{selectedOrder.order_type?.replace('_', ' ')}</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Status:</p>
                  <Badge className={getStatusColor(selectedOrder.status)}>
                    {selectedOrder.status}
                  </Badge>
                </div>
                {selectedOrder.table_number && (
                  <div>
                    <p className="font-semibold text-slate-900">Table:</p>
                    <p className="text-slate-600">{selectedOrder.table_number}</p>
                  </div>
                )}
                {selectedOrder.customer_name && (
                  <div>
                    <p className="font-semibold text-slate-900">Customer:</p>
                    <p className="text-slate-600">{selectedOrder.customer_name}</p>
                  </div>
                )}
                {selectedOrder.customer_phone && (
                  <div>
                    <p className="font-semibold text-slate-900">Phone:</p>
                    <p className="text-slate-600">{selectedOrder.customer_phone}</p>
                  </div>
                )}
                <div>
                  <p className="font-semibold text-slate-900">Date & Time:</p>
                  <p className="text-slate-600">{format(new Date(selectedOrder.created_date), 'MMM d, yyyy h:mm a')}</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Served By:</p>
                  <p className="text-slate-600">{selectedOrder.served_by?.split('@')[0] || 'System'}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold text-slate-900 mb-3">Order Items</h4>
                <div className="space-y-3">
                  {selectedOrder.items?.map((item, idx) => (
                    <div key={idx} className="flex justify-between p-3 bg-slate-50 rounded-lg">
                      <div>
                        <p className="font-medium text-slate-900">{item.name}</p>
                        <p className="text-sm text-slate-600">Quantity: {item.quantity}</p>
                        {item.special_instructions && (
                          <p className="text-sm text-orange-600 mt-1">Note: {item.special_instructions}</p>
                        )}
                      </div>
                      <p className="font-bold text-slate-900">${(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Subtotal:</span>
                  <span className="font-medium">${selectedOrder.subtotal?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Tax:</span>
                  <span className="font-medium">${selectedOrder.tax?.toFixed(2) || '0.00'}</span>
                </div>
                {selectedOrder.discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Discount:</span>
                    <span className="font-medium text-red-600">-${selectedOrder.discount.toFixed(2)}</span>
                  </div>
                )}
                {selectedOrder.tip > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Tip:</span>
                    <span className="font-medium text-green-600">${selectedOrder.tip.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold pt-2 border-t">
                  <span>TOTAL:</span>
                  <span className="text-orange-600">${selectedOrder.total?.toFixed(2) || '0.00'}</span>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Payment Method:</span>
                  <span className="font-medium uppercase">{selectedOrder.payment_method}</span>
                </div>
                <div className="flex justify-between text-sm mt-2">
                  <span className="text-slate-600">Payment Status:</span>
                  <span className={`font-medium uppercase ${
                    selectedOrder.payment_status === 'paid' ? 'text-green-600' : 'text-orange-600'
                  }`}>
                    {selectedOrder.payment_status}
                  </span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Invoice Dialog */}
      <InvoiceDialog 
        order={invoiceOrder} 
        outlet={outlets[0]} 
        onClose={() => setInvoiceOrder(null)} 
      />
    </div>
  );
}