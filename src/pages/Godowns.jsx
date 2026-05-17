import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Warehouse, Package, Edit, MapPin } from 'lucide-react';

export default function Godowns() {
  const [showDialog, setShowDialog] = useState(false);
  const [godownName, setGodownName] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');

  const queryClient = useQueryClient();

  const { data: items = [] } = useQuery({
    queryKey: ['items'],
    queryFn: () => base44.entities.Item.list(),
  });

  const { data: stockEntries = [] } = useQuery({
    queryKey: ['stockEntries'],
    queryFn: () => base44.entities.StockEntry.list(),
  });

  // Get unique godowns with stock summary
  const godownsData = useMemo(() => {
    const godownMap = {};
    
    stockEntries.forEach(entry => {
      const godown = entry.godown || 'Main';
      if (!godownMap[godown]) {
        godownMap[godown] = {
          name: godown,
          totalItems: new Set(),
          totalStock: 0,
          totalValue: 0
        };
      }
      godownMap[godown].totalItems.add(entry.item_id);
    });

    // Calculate current stock per godown
    items.forEach(item => {
      const godown = item.godown || 'Main';
      if (!godownMap[godown]) {
        godownMap[godown] = {
          name: godown,
          totalItems: new Set([item.id]),
          totalStock: 0,
          totalValue: 0
        };
      }
      godownMap[godown].totalStock += item.current_stock || 0;
      godownMap[godown].totalValue += (item.current_stock || 0) * (item.purchase_price || 0);
    });

    return Object.values(godownMap).map(g => ({
      ...g,
      totalItems: g.totalItems.size
    }));
  }, [items, stockEntries]);

  const handleAddGodown = () => {
    if (!godownName) return;
    
    // In a real app, you'd create a Godown entity
    // For now, we'll just show a success message
    alert(`Godown "${godownName}" created! You can now assign items to this godown.`);
    setShowDialog(false);
    setGodownName('');
    setLocation('');
    setDescription('');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#0F1724]">Godowns / Warehouses</h1>
          <p className="text-gray-500 mt-1">Manage your storage locations and stock distribution</p>
        </div>
        <Button onClick={() => setShowDialog(true)} className="bg-emerald-500 hover:bg-emerald-600">
          <Warehouse className="w-4 h-4 mr-2" />
          Add Godown
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-emerald-100">
                <Warehouse className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#0F1724]">{godownsData.length}</p>
                <p className="text-sm text-gray-500">Total Godowns</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-blue-100">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#0F1724]">
                  {godownsData.reduce((sum, g) => sum + g.totalStock, 0).toFixed(0)}
                </p>
                <p className="text-sm text-gray-500">Total Stock Units</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-purple-100">
                <Package className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#0F1724]">
                  {formatCurrency(godownsData.reduce((sum, g) => sum + g.totalValue, 0))}
                </p>
                <p className="text-sm text-gray-500">Total Stock Value</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Godowns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {godownsData.map(godown => (
          <Card key={godown.name} className="border-0 shadow-[0_6px_18px_rgba(15,23,36,0.06)] hover:shadow-lg transition-all">
            <CardHeader className="border-b border-gray-100">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600">
                    <Warehouse className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{godown.name}</CardTitle>
                    <p className="text-xs text-gray-500 mt-1">Active</p>
                  </div>
                </div>
                <Badge className="bg-emerald-100 text-emerald-700">Primary</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Total Items</p>
                  <p className="text-xl font-bold text-blue-600">{godown.totalItems}</p>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Stock Units</p>
                  <p className="text-xl font-bold text-purple-600">{godown.totalStock.toFixed(0)}</p>
                </div>
              </div>
              <div className="p-3 bg-emerald-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Stock Value</p>
                <p className="text-lg font-bold text-emerald-600">{formatCurrency(godown.totalValue)}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 text-xs" size="sm">
                  <Edit className="w-3 h-3 mr-1" />
                  Edit
                </Button>
                <Button variant="outline" className="flex-1 text-xs" size="sm">
                  <Package className="w-3 h-3 mr-1" />
                  View Stock
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add Godown Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Godown</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Godown Name *</Label>
              <Input
                value={godownName}
                onChange={(e) => setGodownName(e.target.value)}
                placeholder="e.g., Main Warehouse, Store Room 1"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Location</Label>
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., Ground Floor, Building A"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Additional details about this godown..."
                className="mt-1"
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddGodown} className="bg-emerald-500 hover:bg-emerald-600">
                Add Godown
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}