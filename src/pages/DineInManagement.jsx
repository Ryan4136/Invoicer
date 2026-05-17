import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Plus, Edit, Clock, CheckCircle } from "lucide-react";

export default function DineInManagement() {
  const queryClient = useQueryClient();
  const [selectedTable, setSelectedTable] = useState(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [tableForm, setTableForm] = useState({
    table_number: '',
    capacity: 4,
    status: 'available',
    section: ''
  });

  const { data: tables = [] } = useQuery({
    queryKey: ['tables'],
    queryFn: () => base44.entities.Table.list(),
    initialData: [],
  });

  const { data: outlets = [] } = useQuery({
    queryKey: ['outlets'],
    queryFn: () => base44.entities.Outlet.list(),
    initialData: [],
  });

  const { data: orders = [] } = useQuery({
    queryKey: ['active-orders'],
    queryFn: async () => {
      const allOrders = await base44.entities.Order.list('-created_date', 100);
      return allOrders.filter(o => ['pending', 'preparing', 'ready'].includes(o.status));
    },
    initialData: [],
  });

  const createTableMutation = useMutation({
    mutationFn: (data) => base44.entities.Table.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      setShowAddDialog(false);
      setTableForm({ table_number: '', capacity: 4, status: 'available', section: '' });
    },
  });

  const updateTableMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Table.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      setSelectedTable(null);
    },
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'occupied':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'reserved':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'cleaning':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getTableOrder = (tableNumber) => {
    return orders.find(o => o.table_number === tableNumber);
  };

  const handleAddTable = () => {
    if (!tableForm.table_number || !outlets[0]?.id) return;
    createTableMutation.mutate({
      ...tableForm,
      outlet_id: outlets[0].id
    });
  };

  const handleUpdateStatus = (table, newStatus) => {
    updateTableMutation.mutate({
      id: table.id,
      data: { ...table, status: newStatus }
    });
  };

  const availableTables = tables.filter(t => t.status === 'available').length;
  const occupiedTables = tables.filter(t => t.status === 'occupied').length;
  const reservedTables = tables.filter(t => t.status === 'reserved').length;

  // Group tables by section
  const sections = [...new Set(tables.map(t => t.section || 'Main'))];

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Dine-In Management</h1>
          <p className="text-slate-600">Manage tables and seating arrangements</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} className="bg-gradient-to-r from-orange-500 to-amber-600">
          <Plus className="w-4 h-4 mr-2" />
          Add Table
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-none shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Tables</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-slate-900">{tables.length}</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Available</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{availableTables}</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg border-l-4 border-l-red-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Occupied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-600">{occupiedTables}</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg border-l-4 border-l-yellow-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Reserved</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-yellow-600">{reservedTables}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tables by Section */}
      {sections.map(section => (
        <div key={section} className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900">{section}</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {tables.filter(t => (t.section || 'Main') === section).map(table => {
              const order = getTableOrder(table.table_number);
              return (
                <Card
                  key={table.id}
                  className={`border-2 ${getStatusColor(table.status)} cursor-pointer hover:shadow-lg transition-all`}
                  onClick={() => setSelectedTable(table)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-bold">Table {table.table_number}</CardTitle>
                      <Badge variant="outline" className="text-xs">
                        <Users className="w-3 h-3 mr-1" />
                        {table.capacity}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Badge className={getStatusColor(table.status)}>
                      {table.status}
                    </Badge>
                    {order && (
                      <div className="mt-2 text-xs text-slate-600">
                        <p className="font-medium">Order #{order.order_number?.slice(-4)}</p>
                        <p>${(order.total || 0).toFixed(2)}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ))}

      {/* Add Table Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Table</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Table Number</Label>
              <Input
                value={tableForm.table_number}
                onChange={(e) => setTableForm({...tableForm, table_number: e.target.value})}
                placeholder="e.g., 1, A1, VIP-1"
              />
            </div>

            <div className="space-y-2">
              <Label>Capacity</Label>
              <Input
                type="number"
                value={tableForm.capacity}
                onChange={(e) => setTableForm({...tableForm, capacity: parseInt(e.target.value)})}
              />
            </div>

            <div className="space-y-2">
              <Label>Section</Label>
              <Input
                value={tableForm.section}
                onChange={(e) => setTableForm({...tableForm, section: e.target.value})}
                placeholder="e.g., Main Hall, Patio, VIP"
              />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowAddDialog(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleAddTable} className="flex-1 bg-gradient-to-r from-orange-500 to-amber-600">
                Add Table
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Table Details Dialog */}
      <Dialog open={!!selectedTable} onOpenChange={() => setSelectedTable(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Table {selectedTable?.table_number}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <Label className="text-slate-600">Capacity</Label>
                <p className="font-medium text-slate-900">{selectedTable?.capacity} seats</p>
              </div>
              <div>
                <Label className="text-slate-600">Section</Label>
                <p className="font-medium text-slate-900">{selectedTable?.section || 'Main'}</p>
              </div>
              <div>
                <Label className="text-slate-600">Status</Label>
                <Badge className={getStatusColor(selectedTable?.status)}>
                  {selectedTable?.status}
                </Badge>
              </div>
            </div>

            {getTableOrder(selectedTable?.table_number) && (
              <div className="p-4 bg-slate-50 rounded-lg">
                <p className="font-medium text-slate-900 mb-2">Active Order</p>
                <p className="text-sm text-slate-600">
                  Order #{getTableOrder(selectedTable?.table_number)?.order_number?.slice(-4)}
                </p>
                <p className="text-sm font-medium text-slate-900">
                  ${(getTableOrder(selectedTable?.table_number)?.total || 0).toFixed(2)}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label>Change Status</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleUpdateStatus(selectedTable, 'available')}
                  className="w-full"
                  disabled={selectedTable?.status === 'available'}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Available
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleUpdateStatus(selectedTable, 'occupied')}
                  className="w-full"
                  disabled={selectedTable?.status === 'occupied'}
                >
                  <Users className="w-4 h-4 mr-2" />
                  Occupied
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleUpdateStatus(selectedTable, 'reserved')}
                  className="w-full"
                  disabled={selectedTable?.status === 'reserved'}
                >
                  <Clock className="w-4 h-4 mr-2" />
                  Reserved
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleUpdateStatus(selectedTable, 'cleaning')}
                  className="w-full"
                  disabled={selectedTable?.status === 'cleaning'}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Cleaning
                </Button>
              </div>
            </div>

            <Button variant="outline" onClick={() => setSelectedTable(null)} className="w-full">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}