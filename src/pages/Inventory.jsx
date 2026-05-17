import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Package, AlertTriangle, TrendingUp, Edit } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";

export default function Inventory() {
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    unit: 'kg',
    current_stock: 0,
    min_stock: 0,
    max_stock: 100,
    unit_cost: 0,
    supplier: ''
  });

  const { data: ingredients = [] } = useQuery({
    queryKey: ['ingredients'],
    queryFn: () => base44.entities.Ingredient.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Ingredient.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingredients'] });
      setShowDialog(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Ingredient.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingredients'] });
      setShowDialog(false);
      setEditingItem(null);
      resetForm();
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      unit: 'kg',
      current_stock: 0,
      min_stock: 0,
      max_stock: 100,
      unit_cost: 0,
      supplier: ''
    });
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData(item);
    setShowDialog(true);
  };

  const handleSubmit = () => {
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const getStockStatus = (item) => {
    if (item.current_stock <= item.min_stock) return { status: 'critical', color: 'red' };
    if (item.current_stock < item.min_stock * 1.5) return { status: 'low', color: 'yellow' };
    return { status: 'good', color: 'green' };
  };

  const getStockPercentage = (item) => {
    return Math.min(100, (item.current_stock / (item.max_stock || 100)) * 100);
  };

  const lowStockCount = ingredients.filter(i => i.current_stock <= i.min_stock).length;
  const totalValue = ingredients.reduce((sum, i) => sum + (i.current_stock * (i.unit_cost || 0)), 0);

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Inventory Management</h1>
          <p className="text-slate-600">Track and manage ingredient stock levels</p>
        </div>
        <Button 
          onClick={() => { setEditingItem(null); resetForm(); setShowDialog(true); }}
          className="bg-gradient-to-r from-orange-500 to-amber-600"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Ingredient
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <p className="text-3xl font-bold text-slate-900">{ingredients.length}</p>
              <Package className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Low Stock Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <p className="text-3xl font-bold text-orange-600">{lowStockCount}</p>
              <AlertTriangle className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Inventory Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <p className="text-3xl font-bold text-green-600">${totalValue.toFixed(2)}</p>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Inventory List */}
      <Card className="border-none shadow-lg">
        <CardHeader>
          <CardTitle>Ingredient Stock</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {ingredients.map(item => {
              const { status, color } = getStockStatus(item);
              const percentage = getStockPercentage(item);
              
              return (
                <div key={item.id} className="p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-semibold text-slate-900 text-lg">{item.name}</h3>
                        <Badge 
                          className={`
                            ${color === 'red' ? 'bg-red-100 text-red-700 border-red-200' : ''}
                            ${color === 'yellow' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' : ''}
                            ${color === 'green' ? 'bg-green-100 text-green-700 border-green-200' : ''}
                          `}
                        >
                          {status}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600">
                        Supplier: {item.supplier || 'Not specified'} • Min: {item.min_stock} {item.unit}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-2xl font-bold text-slate-900">
                          {item.current_stock} <span className="text-sm font-normal text-slate-600">{item.unit}</span>
                        </p>
                        {item.unit_cost > 0 && (
                          <p className="text-xs text-slate-500">
                            ${(item.current_stock * item.unit_cost).toFixed(2)} value
                          </p>
                        )}
                      </div>
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => handleEdit(item)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Edit Ingredient' : 'Add New Ingredient'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Ingredient Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="e.g., Chicken Breast"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Unit</Label>
                <Select 
                  value={formData.unit} 
                  onValueChange={(val) => setFormData({...formData, unit: val})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kg">Kilogram (kg)</SelectItem>
                    <SelectItem value="g">Gram (g)</SelectItem>
                    <SelectItem value="l">Liter (l)</SelectItem>
                    <SelectItem value="ml">Milliliter (ml)</SelectItem>
                    <SelectItem value="pcs">Pieces</SelectItem>
                    <SelectItem value="dozen">Dozen</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Current Stock</Label>
                <Input
                  type="number"
                  value={formData.current_stock}
                  onChange={(e) => setFormData({...formData, current_stock: parseFloat(e.target.value)})}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Minimum Stock</Label>
                <Input
                  type="number"
                  value={formData.min_stock}
                  onChange={(e) => setFormData({...formData, min_stock: parseFloat(e.target.value)})}
                />
              </div>

              <div className="space-y-2">
                <Label>Maximum Stock</Label>
                <Input
                  type="number"
                  value={formData.max_stock}
                  onChange={(e) => setFormData({...formData, max_stock: parseFloat(e.target.value)})}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Unit Cost ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.unit_cost}
                  onChange={(e) => setFormData({...formData, unit_cost: parseFloat(e.target.value)})}
                />
              </div>

              <div className="space-y-2">
                <Label>Supplier</Label>
                <Input
                  value={formData.supplier}
                  onChange={(e) => setFormData({...formData, supplier: e.target.value})}
                  placeholder="Supplier name"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit}
                className="bg-gradient-to-r from-orange-500 to-amber-600"
                disabled={!formData.name}
              >
                {editingItem ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}