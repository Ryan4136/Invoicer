import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Tag, Package } from 'lucide-react';

export default function Categories() {
  const [showDialog, setShowDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryName, setCategoryName] = useState('');
  const [description, setDescription] = useState('');

  const queryClient = useQueryClient();

  // ===========================
  // ✅ SINGLE SOURCE OF CATEGORIES (PHP API)
  // ===========================
  const { data: categoryList = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await fetch(
        "http://localhost:8000/api/categories/list.php",
        { credentials: "include" }
      );
      return res.json();
    }
  });

  // ===========================
  // ✅ PRODUCTS (for Total Items card only)
  // ===========================
  const { data: items = [] } = useQuery({
    queryKey: ['items'],
    queryFn: () => base44.entities.Item.list(),
  });

  // ===========================
  // ✅ FINAL VARIABLE USED IN UI
  // ===========================
  const categories = useMemo(
    () => categoryList,
    [categoryList]
  );

  // ===========================
  // CRUD HANDLERS
  // ===========================

  const handleSave = async () => {
    if (!categoryName) return;

    const payload = {
      category_id: editingCategory?.id,
      category_name: categoryName,
      category_active: 1,
      company_id: 1
    };

    const url = editingCategory
      ? "http://localhost:8000/api/categories/update.php"
      : "http://localhost:8000/api/categories/create.php";

    await fetch(url, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    queryClient.invalidateQueries({ queryKey: ['categories'] });

    setShowDialog(false);
    setCategoryName('');
    setDescription('');
    setEditingCategory(null);
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setCategoryName(category.name);
    setShowDialog(true);
  };

  const handleDelete = async (category) => {
    if (category.itemCount > 0) {
      alert(`Cannot delete "${category.name}" - it has ${category.itemCount} items.`);
      return;
    }

    if (confirm(`Delete category "${category.name}"?`)) {
      await fetch(
        `http://localhost:8000/api/categories/delete.php?id=${category.id}`,
        { credentials: "include" }
      );

      queryClient.invalidateQueries({ queryKey: ['categories'] });
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  // ===========================
  // UI (YOUR DESIGN — UNCHANGED)
  // ===========================

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#0F1724]">Categories</h1>
          <p className="text-gray-500 mt-1">Organize your inventory by categories</p>
        </div>
        <Button onClick={() => {
          setCategoryName('');
          setDescription('');
          setEditingCategory(null);
          setShowDialog(true);
        }} className="bg-emerald-500 hover:bg-emerald-600">
          <Plus className="w-4 h-4 mr-2" />
          Add Category
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-emerald-100">
                <Tag className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#0F1724]">
                  {categories.length}
                </p>
                <p className="text-sm text-gray-500">Total Categories</p>
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
                  {items.length}
                </p>
                <p className="text-sm text-gray-500">Total Items</p>
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
                    categories.reduce((sum, c) => sum + Number(c.totalValue || 0), 0)                  )}
                </p>
                <p className="text-sm text-gray-500">Total Value</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map(category => (
          <Card key={category.id} className="border-0 shadow-[0_6px_18px_rgba(15,23,36,0.06)] hover:shadow-lg transition-all">
            <CardHeader className="border-b border-gray-100">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600">
                    <Tag className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{category.name}</CardTitle>
                    <p className="text-xs text-gray-500 mt-1">
                      {category.itemCount || 0} items
                    </p>
                  </div>
                </div>
                <Badge className="bg-emerald-100 text-emerald-700">
                  {category.itemCount || 0}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Stock Units</p>
                  <p className="text-xl font-bold text-blue-600">
                    {Number(category.totalStock || 0).toFixed(0)}                  </p>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Stock Value</p>
                  <p className="text-lg font-bold text-purple-600">
                    {formatCurrency(Number(category.totalValue || 0))}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 text-xs" size="sm"
                  onClick={() => handleEdit(category)}>
                  <Edit className="w-3 h-3 mr-1" />
                  Edit
                </Button>

                <Button 
                  variant="outline"
                  className="flex-1 text-xs text-red-500 hover:text-red-700"
                  size="sm"
                  onClick={() => handleDelete(category)}
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
              {editingCategory ? 'Edit Category' : 'Add New Category'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Category Name *</Label>
              <Input
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                placeholder="e.g., Electronics, Grocery, Stationery"
                className="mt-1"
              />
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Additional details about this category..."
                className="mt-1"
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} className="bg-emerald-500 hover:bg-emerald-600">
                {editingCategory ? 'Update' : 'Add'} Category
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
