import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Award, Package } from 'lucide-react';

export default function Brands() {
  const [showDialog, setShowDialog] = useState(false);
  const [editingBrand, setEditingBrand] = useState(null);
  const [brandName, setBrandName] = useState('');
  const [description, setDescription] = useState('');

  const queryClient = useQueryClient();

  // 👉 REAL brands + product stats from your joined SQL
  const { data: brands = [] } = useQuery({
    queryKey: ['brands'],
    queryFn: async () => {
      const res = await fetch("http://localhost:8000/api/brands/list.php", {
        credentials: "include"
      });
      return res.json();
    }
  });

  // 👉 Products only for “Total Products” card
  const { data: items = [] } = useQuery({
    queryKey: ['items'],
    queryFn: () => base44.entities.Item.list(),
  });

  const handleSave = async () => {
    if (!brandName) return;

    const payload = {
      brand_id: editingBrand?.id,
      brand_name: brandName,
      brand_active: 1,
      brand_status: 1,
      company_id: 1
    };

    const url = editingBrand
      ? "http://localhost:8000/api/brands/update.php"
      : "http://localhost:8000/api/brands/create.php";

    await fetch(url, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    queryClient.invalidateQueries({ queryKey: ['brands'] });

    setShowDialog(false);
    setBrandName('');
    setDescription('');
    setEditingBrand(null);
  };

  const handleEdit = (brand) => {
    setEditingBrand(brand);
    setBrandName(brand.name);
    setShowDialog(true);
  };

  const handleDelete = async (brand) => {
    if (brand.itemCount > 0) {
      alert(`Cannot delete "${brand.name}" - it has ${brand.itemCount} items.`);
      return;
    }

    if (confirm(`Delete brand "${brand.name}"?`)) {
      await fetch(
        `http://localhost:8000/api/brands/delete.php?id=${brand.id}`,
        { credentials: "include" }
      );

      queryClient.invalidateQueries({ queryKey: ['brands'] });
    }
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
          <h1 className="text-2xl md:text-3xl font-bold text-[#0F1724]">Brands</h1>
          <p className="text-gray-500 mt-1">Manage product brands and manufacturers</p>
        </div>
        <Button
          onClick={() => {
            setBrandName('');
            setDescription('');
            setEditingBrand(null);
            setShowDialog(true);
          }}
          className="bg-emerald-500 hover:bg-emerald-600"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Brand
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-blue-100">
                <Award className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#0F1724]">
                  {brands.length}
                </p>
                <p className="text-sm text-gray-500">Total Brands</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-emerald-100">
                <Package className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#0F1724]">
                  {brands.reduce((sum, b) => sum + Number(b.itemCount || 0), 0)}
                </p>
                <p className="text-sm text-gray-500">Total Products</p>
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
                  {formatCurrency(
                    brands.reduce((sum, b) => sum + Number(b.totalValue || 0), 0)
                  )}
                </p>
                <p className="text-sm text-gray-500">Total Value</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Brands Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {brands.map(brand => (
          <Card
            key={`${brand.product_id}-${brand.product_name}`}
            className="border-0 shadow-[0_6px_18px_rgba(15,23,36,0.06)] hover:shadow-lg transition-all"
          >
            <CardHeader className="border-b border-gray-100">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600">
                    <Award className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{brand.name}</CardTitle>
                    <p className="text-xs text-gray-500 mt-1">
                      {brand.itemCount} products
                    </p>
                  </div>
                </div>
                <Badge className="bg-blue-100 text-blue-700">
                  {brand.itemCount}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-emerald-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Stock Units</p>
                  <p className="text-xl font-bold text-emerald-600">
                    {Number(brand.totalStock || 0).toFixed(0)}
                  </p>
                </div>

                <div className="p-3 bg-purple-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Stock Value</p>
                  <p className="text-lg font-bold text-purple-600">
                    {formatCurrency(brand.totalValue)}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 text-xs"
                  size="sm"
                  onClick={() => handleEdit(brand)}
                >
                  <Edit className="w-3 h-3 mr-1" />
                  Edit
                </Button>

                <Button
                  variant="outline"
                  className="flex-1 text-xs text-red-500 hover:text-red-700"
                  size="sm"
                  onClick={() => handleDelete(brand)}
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingBrand ? 'Edit Brand' : 'Add New Brand'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Brand Name *</Label>
              <Input
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="e.g., Samsung, Nike, Parle"
                className="mt-1"
              />
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Additional details about this brand..."
                className="mt-1"
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDialog(false)}
              >
                Cancel
              </Button>

              <Button
                onClick={handleSave}
                className="bg-emerald-500 hover:bg-emerald-600"
              >
                {editingBrand ? 'Update' : 'Add'} Brand
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
