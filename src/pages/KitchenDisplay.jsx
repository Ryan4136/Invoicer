import React, { useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle, ChefHat, AlertTriangle } from "lucide-react";
import { format } from "date-fns";

export default function KitchenDisplay() {
  const queryClient = useQueryClient();

  const { data: orders = [] } = useQuery({
    queryKey: ['active-orders'],
    queryFn: async () => {
      const allOrders = await base44.entities.Order.list('-created_date', 50);
      return allOrders.filter(o => ['pending', 'preparing'].includes(o.status));
    },
    refetchInterval: 5000, // Auto-refresh every 5 seconds
  });

  const updateOrderMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Order.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-orders'] });
    },
  });

  const markAsPreparing = (order) => {
    updateOrderMutation.mutate({
      id: order.id,
      data: { ...order, status: 'preparing' }
    });
  };

  const markAsReady = (order) => {
    updateOrderMutation.mutate({
      id: order.id,
      data: { ...order, status: 'ready' }
    });
  };

  const getOrderAge = (createdDate) => {
    const now = new Date();
    const created = new Date(createdDate);
    const diffMinutes = Math.floor((now - created) / 1000 / 60);
    return diffMinutes;
  };

  const getUrgencyColor = (minutes) => {
    if (minutes > 30) return 'bg-red-500';
    if (minutes > 15) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const pendingOrders = orders.filter(o => o.status === 'pending');
  const preparingOrders = orders.filter(o => o.status === 'preparing');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50/30 to-slate-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
              <ChefHat className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Kitchen Display System</h1>
              <p className="text-slate-600">
                {orders.length} active {orders.length === 1 ? 'order' : 'orders'}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-slate-900">
              {new Date().toLocaleTimeString()}
            </p>
            <p className="text-sm text-slate-600">
              {format(new Date(), 'EEEE, MMMM d')}
            </p>
          </div>
        </div>

        {/* Order Queues */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* New Orders */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-2 bg-gradient-to-b from-orange-500 to-amber-600 rounded-full" />
              <h2 className="text-xl font-bold text-slate-900">
                New Orders ({pendingOrders.length})
              </h2>
            </div>
            <div className="space-y-4">
              {pendingOrders.length === 0 ? (
                <Card className="border-none shadow-lg bg-white/80 backdrop-blur-sm">
                  <CardContent className="p-8 text-center">
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
                    <p className="text-slate-600">No pending orders</p>
                  </CardContent>
                </Card>
              ) : (
                pendingOrders.map(order => {
                  const age = getOrderAge(order.created_date);
                  return (
                    <Card key={order.id} className="border-none shadow-lg hover:shadow-xl transition-all bg-white/80 backdrop-blur-sm">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${getUrgencyColor(age)} animate-pulse`} />
                            <div>
                              <CardTitle className="text-slate-900 text-2xl font-bold">
                                #{order.order_number?.slice(-4)}
                              </CardTitle>
                              <p className="text-slate-600 text-sm">
                                {order.table_number ? `Table ${order.table_number}` : order.order_type}
                              </p>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-orange-600 border-orange-400 bg-orange-50">
                            {age} min ago
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {order.items?.map((item, idx) => (
                          <div key={idx} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-amber-600 rounded-lg flex items-center justify-center text-white font-bold shadow-sm">
                              {item.quantity}
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold text-slate-900 text-lg">{item.name}</p>
                              {item.special_instructions && (
                                <div className="flex items-start gap-2 mt-1">
                                  <AlertTriangle className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
                                  <p className="text-sm text-orange-600">{item.special_instructions}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                        <Button
                          className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 h-12 shadow-lg"
                          onClick={() => markAsPreparing(order)}
                        >
                          <Clock className="w-5 h-5 mr-2" />
                          Start Preparing
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </div>

          {/* Preparing Orders */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-2 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full" />
              <h2 className="text-xl font-bold text-slate-900">
                In Progress ({preparingOrders.length})
              </h2>
            </div>
            <div className="space-y-4">
              {preparingOrders.length === 0 ? (
                <Card className="border-none shadow-lg bg-white/80 backdrop-blur-sm">
                  <CardContent className="p-8 text-center">
                    <ChefHat className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                    <p className="text-slate-600">No orders in progress</p>
                  </CardContent>
                </Card>
              ) : (
                preparingOrders.map(order => {
                  const age = getOrderAge(order.created_date);
                  return (
                    <Card key={order.id} className="border-none shadow-lg border-l-4 border-l-blue-500 bg-white/80 backdrop-blur-sm">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <Clock className="w-5 h-5 text-blue-500 animate-spin" style={{animationDuration: '3s'}} />
                            <div>
                              <CardTitle className="text-slate-900 text-2xl font-bold">
                                #{order.order_number?.slice(-4)}
                              </CardTitle>
                              <p className="text-slate-600 text-sm">
                                {order.table_number ? `Table ${order.table_number}` : order.order_type}
                              </p>
                            </div>
                          </div>
                          <Badge className={`${getUrgencyColor(age)} text-white border-0`}>
                            {age} min
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {order.items?.map((item, idx) => (
                          <div key={idx} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold shadow-sm">
                              {item.quantity}
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold text-slate-900 text-lg">{item.name}</p>
                              {item.special_instructions && (
                                <p className="text-sm text-orange-600 mt-1">{item.special_instructions}</p>
                              )}
                            </div>
                          </div>
                        ))}
                        <Button
                          className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 h-12 shadow-lg"
                          onClick={() => markAsReady(order)}
                        >
                          <CheckCircle className="w-5 h-5 mr-2" />
                          Mark as Ready
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}