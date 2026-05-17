import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import DataTable from '@/components/ui/DataTable';
import {
  Plus,
  ArrowRightLeft,
  Search,
  Package
} from 'lucide-react';
import { format } from 'date-fns';

export default function StockTransfer() {
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    item_id: '',
    item_name: '',
    quantity: 1,
    from_godown: 'Main',
    to_godown: '',
    narration: ''
  });

  const { data: transfers = [], isLoading } = useQuery({
    queryKey: ['stockEntries', 'transfer'],
    queryFn: async () => {
      const entries = await base44.entities.StockEntry.filter({ entry_type: 'transfer_out' }, '-created_date');
      return entries;
    },
  });

  const { data: items = [] } = useQuery({
    queryKey: ['items'],
    queryFn: () => base44.entities.Item.filter({ is_active: true, is_service: false }),
  });

  const { data: company } = useQuery({
    queryKey: ['company'],
    queryFn: async () => {
      const companies = await base44.entities.Company.list();
      return companies[0];
    },
  });

  // Get unique godowns from items
  const godowns = [...new Set(items.map(i => i.godown || 'Main').filter(Boolean))];

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const item = items.find(i => i.id === data.item_id);
      if (!item) throw new Error('Item not found');

      // Create transfer out entry
      await base44.entities.StockEntry.create({
        entry_type: 'transfer_out',
        item_id: data.item_id,
        item_name: item.name,
        quantity: -data.quantity,
        unit: item.unit,
        godown: data.from_godown,
        reference_type: 'transfer',
        narration: `Transfer to ${data.to_godown}: ${data.narration}`,
        stock_before: item.current_stock,
        stock_after: item.current_stock - data.quantity,
        company_id: company?.id
      });

      // Create transfer in entry
      await base44.entities.StockEntry.create({
        entry_type: 'transfer_in',
        item_id: data.item_id,
        item_name: item.name,
        quantity: data.quantity,
        unit: item.unit,
        godown: data.to_godown,
        reference_type: 'transfer',
        narration: `Transfer from ${data.from_godown}: ${data.narration}`,
        company_id: company?.id
      });

      // Note: In a multi-godown system, you'd update stock per godown
      // For now we keep total stock same since it's just a location transfer
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stockEntries'] });
      resetForm();
    },
  });

  const resetForm = () => {
    setFormData({
      item_id: '',
      item_name: '',
      quantity: 1,
      from_godown: 'Main',
      to_godown: '',
      narration: ''
    });
    setShowForm(false);
  };

  const handleItemSelect = (itemId) => {
    const item = items.find(i => i.id === itemId);
    if (item) {
      setFormData(prev => ({
        ...prev,
        item_id: itemId,
        item_name: item.name,
        from_godown: item.godown || 'Main'
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.from_godown === formData.to_godown) {
      alert('Source and destination godown cannot be same');
      return;
    }
    createMutation.mutate(formData);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return format(new Date(dateStr), 'dd MMM yyyy HH:mm');
  };

  const columns = [
    {
      header: 'Date',
      render: (row) => formatDate(row.created_date)
    },
    {
      header: 'Item',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <Package className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-medium text-[#0F1724]">{row.item_name}</p>
          </div>
        </div>
      )
    },
    {
      header: 'Quantity',
      render: (row) => (
        <p className="font-semibold">{Math.abs(row.quantity)} {row.unit}</p>
      )
    },
    {
      header: 'From',
      render: (row) => (
        <Badge variant="secondary" className="bg-red-100 text-red-700">
          {row.godown}
        </Badge>
      )
    },
    {
      header: 'To',
      render: (row) => {
        const match = row.narration?.match(/Transfer to ([^:]+)/);
        return (
          <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
            {match ? match[1] : '-'}
          </Badge>
        );
      }
    },
    {
      header: 'Notes',
      render: (row) => {
        const match = row.narration?.match(/: (.+)$/);
        return match ? match[1] : '-';
      }
    }
  ];

  const filteredTransfers = transfers.filter(t =>
    !searchQuery ||
    t.item_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedItem = items.find(i => i.id === formData.item_id);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#0F1724]">Stock Transfer</h1>
          <p className="text-gray-500 mt-1">Transfer stock between godowns/locations</p>
        </div>
        <Button 
          className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-lg shadow-emerald-500/20"
          onClick={() => setShowForm(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          New Transfer
        </Button>
      </div>

      <Card className="border-0 shadow-[0_6px_18px_rgba(15,23,36,0.06)]">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search transfers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-[#F7F9FA] border-0"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-[0_6px_18px_rgba(15,23,36,0.06)]">
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={filteredTransfers}
            isLoading={isLoading}
            searchable={false}
            emptyMessage="No stock transfers found"
          />
        </CardContent>
      </Card>

      <Dialog open={showForm} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5" />
              New Stock Transfer
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Select Item *</Label>
              <Select value={formData.item_id} onValueChange={handleItemSelect}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Select item to transfer" />
                </SelectTrigger>
                <SelectContent>
                  {items.map(item => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name} ({item.current_stock} {item.unit} in {item.godown || 'Main'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedItem && (
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-sm font-medium text-blue-900">{selectedItem.name}</p>
                <p className="text-xs text-blue-600">
                  Available: {selectedItem.current_stock} {selectedItem.unit} in {selectedItem.godown || 'Main'}
                </p>
              </div>
            )}

            <div>
              <Label>Quantity to Transfer *</Label>
              <Input
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                min="1"
                max={selectedItem?.current_stock || 999999}
                className="mt-1.5"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>From Godown</Label>
                <Select value={formData.from_godown} onValueChange={(v) => setFormData({ ...formData, from_godown: v })}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {godowns.map(g => (
                      <SelectItem key={g} value={g}>{g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>To Godown *</Label>
                <Select value={formData.to_godown} onValueChange={(v) => setFormData({ ...formData, to_godown: v })}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Select destination" />
                  </SelectTrigger>
                  <SelectContent>
                    {godowns.filter(g => g !== formData.from_godown).map(g => (
                      <SelectItem key={g} value={g}>{g}</SelectItem>
                    ))}
                    <SelectItem value="Warehouse-2">Warehouse-2</SelectItem>
                    <SelectItem value="Shop">Shop</SelectItem>
                    <SelectItem value="Storage">Storage</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Notes</Label>
              <Textarea
                value={formData.narration}
                onChange={(e) => setFormData({ ...formData, narration: e.target.value })}
                placeholder="Reason for transfer..."
                className="mt-1.5"
                rows={2}
              />
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-gradient-to-r from-emerald-500 to-green-600"
                disabled={createMutation.isPending || !formData.item_id || !formData.to_godown}
              >
                {createMutation.isPending ? 'Transferring...' : 'Transfer Stock'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}