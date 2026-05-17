import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import DataTable from '@/components/ui/DataTable';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

export default function StockAdjustment() {
  const [showDialog, setShowDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [adjustmentType, setAdjustmentType] = useState('increase');
  const [quantity, setQuantity] = useState('');
  const [godown, setGodown] = useState('Main');
  const [narration, setNarration] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const queryClient = useQueryClient();

  const { data: items = [] } = useQuery({
    queryKey: ['items'],
    queryFn: () => base44.entities.Item.list(),
  });

  const { data: stockEntries = [] } = useQuery({
    queryKey: ['stockAdjustments'],
    queryFn: () => base44.entities.StockEntry.filter({ entry_type: 'adjustment' }, '-created_date'),
  });

  const createAdjustmentMutation = useMutation({
    mutationFn: async (data) => {
      const entry = await base44.entities.StockEntry.create(data);
      // Update item stock
      const item = items.find(i => i.id === data.item_id);
      if (item) {
        await base44.entities.Item.update(item.id, {
          current_stock: (item.current_stock || 0) + data.quantity
        });
      }
      return entry;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stockAdjustments'] });
      queryClient.invalidateQueries({ queryKey: ['items'] });
      setShowDialog(false);
      resetForm();
    },
  });

  const deleteAdjustmentMutation = useMutation({
    mutationFn: async (entry) => {
      // Reverse the stock change
      const item = items.find(i => i.id === entry.item_id);
      if (item) {
        await base44.entities.Item.update(item.id, {
          current_stock: (item.current_stock || 0) - entry.quantity
        });
      }
      await base44.entities.StockEntry.delete(entry.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stockAdjustments'] });
      queryClient.invalidateQueries({ queryKey: ['items'] });
    },
  });

  const resetForm = () => {
    setSelectedItem(null);
    setAdjustmentType('increase');
    setQuantity('');
    setGodown('Main');
    setNarration('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedItem || !quantity) return;

    const item = items.find(i => i.id === selectedItem);
    const adjustedQty = adjustmentType === 'increase' ? parseFloat(quantity) : -parseFloat(quantity);
    
    createAdjustmentMutation.mutate({
      entry_type: 'adjustment',
      item_id: selectedItem,
      item_name: item.name,
      quantity: adjustedQty,
      unit: item.unit,
      rate: item.purchase_price || 0,
      total_value: adjustedQty * (item.purchase_price || 0),
      godown: godown,
      reference_type: 'manual',
      narration: narration || `Stock ${adjustmentType} - ${item.name}`,
      stock_before: item.current_stock || 0,
      stock_after: (item.current_stock || 0) + adjustedQty
    });
  };

  const handleDelete = (entry) => {
    if (confirm('Delete this adjustment? The stock will be reversed.')) {
      deleteAdjustmentMutation.mutate(entry);
    }
  };

  const filteredItems = items.filter(item =>
    item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.code?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const columns = [
    { header: 'Date', render: (row) => format(new Date(row.created_date), 'dd/MM/yyyy HH:mm') },
    { header: 'Item Name', accessor: 'item_name' },
    { header: 'Type', render: (row) => (
      <span className={`px-2 py-1 rounded text-xs font-medium ${
        row.quantity > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
      }`}>
        {row.quantity > 0 ? 'Increase' : 'Decrease'}
      </span>
    )},
    { header: 'Quantity', render: (row) => (
      <span className={row.quantity > 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
        {row.quantity > 0 ? '+' : ''}{row.quantity} {row.unit}
      </span>
    ), cellClassName: 'text-right' },
    { header: 'Godown', accessor: 'godown' },
    { header: 'Before', render: (row) => row.stock_before?.toFixed(2) || '0.00', cellClassName: 'text-right' },
    { header: 'After', render: (row) => row.stock_after?.toFixed(2) || '0.00', cellClassName: 'text-right' },
    { header: 'Narration', accessor: 'narration' },
    { header: 'Actions', render: (row) => (
      <Button
        variant="ghost"
        size="icon"
        onClick={() => handleDelete(row)}
        className="text-red-500 hover:text-red-700"
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    )}
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#0F1724]">Stock Adjustment</h1>
          <p className="text-gray-500 mt-1">Increase or decrease stock for physical verification</p>
        </div>
        <Button onClick={() => setShowDialog(true)} className="bg-emerald-500 hover:bg-emerald-600">
          <Plus className="w-4 h-4 mr-2" />
          New Adjustment
        </Button>
      </div>

      {/* Adjustments Table */}
      <Card className="border-0 shadow-[0_6px_18px_rgba(15,23,36,0.06)]">
        <CardHeader className="border-b border-gray-100">
          <CardTitle>Stock Adjustment History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={stockEntries}
            searchable={false}
            emptyMessage="No adjustments found"
          />
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Stock Adjustment</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Adjustment Type</Label>
              <Select value={adjustmentType} onValueChange={setAdjustmentType}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="increase">Increase Stock</SelectItem>
                  <SelectItem value="decrease">Decrease Stock</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Search Item</Label>
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or code..."
                className="mt-1"
              />
            </div>

            <div>
              <Label>Select Item *</Label>
              <Select value={selectedItem || ''} onValueChange={setSelectedItem}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Choose an item" />
                </SelectTrigger>
                <SelectContent>
                  {filteredItems.map(item => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name} ({item.code}) - Current: {item.current_stock} {item.unit}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Quantity *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Godown</Label>
                <Input
                  value={godown}
                  onChange={(e) => setGodown(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label>Narration</Label>
              <Textarea
                value={narration}
                onChange={(e) => setNarration(e.target.value)}
                rows={3}
                className="mt-1"
                placeholder="Reason for adjustment..."
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-emerald-500 hover:bg-emerald-600">
                Save Adjustment
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}