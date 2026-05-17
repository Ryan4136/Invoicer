import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
import { Switch } from '@/components/ui/switch';
import DataTable from '@/components/ui/DataTable';
import {
  Plus,
  Package,
  Edit2,
  Trash2,
  Search,
  Filter,
  Barcode
} from 'lucide-react';
import { ExportButton, ImportButton } from '@/components/ui/ExportImportButtons';

const UNITS = ['PCS', 'KG', 'GM', 'LTR', 'ML', 'MTR', 'CM', 'BOX', 'PKT', 'DZN', 'SET'];
const GST_RATES = [0, 5, 12, 18, 28];

export default function Items() {
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    barcode: '',
    hsn_code: '',
    category: '',
    brand: '',
    unit: 'PCS',
    purchase_price: 0,
    sale_price: 0,
    mrp: 0,
    gst_rate: 18,
    cess_rate: 0,
    opening_stock: 0,
    current_stock: 0,
    reorder_level: 0,
    godown: 'Main',
    is_service: false,
    is_active: true
  });

const { data: items = [], isLoading } = useQuery({
  queryKey: ['items'],
  queryFn: async () => {
    const res = await fetch("http://localhost:8000/api/products/list.php", {
      credentials: "include"
    });

    if (!res.ok) throw new Error("Failed to load products");
    return res.json();
  },
});


 // const createMutation = useMutation({
  //  mutationFn: (data) => base44.entities.Item.create(data),
   // onSuccess: () => {
   //   queryClient.invalidateQueries({ queryKey: ['items'] });
   //   resetForm();
   // },
//  });

  // const updateMutation = useMutation({
  //   mutationFn: ({ id, data }) => base44.entities.Item.update(id, data),
  //   onSuccess: () => {
  //     queryClient.invalidateQueries({ queryKey: ['items'] });
  //     resetForm();
  //   },
  // });

  // const deleteMutation = useMutation({
  //   mutationFn: (id) => base44.entities.Item.delete(id),
  //   onSuccess: () => {
  //     queryClient.invalidateQueries({ queryKey: ['items'] });
  //   },
  // });

const resetForm = () => {
  setEditingItem(null);
  setShowForm(false);
  setFormData({
    name: '',
    code: '',
    barcode: '',
    hsn_code: '',
    category: '',
    brand: '',
    unit: 'PCS',
    purchase_price: 0,
    sale_price: 0,
    mrp: 0,
    gst_rate: 18,
    cess_rate: 0,
    opening_stock: 0,
    current_stock: 0,
    reorder_level: 0,
    godown: 'Main',
    is_service: false,
    is_active: true
  });
};

const handleEdit = (item) => {
  setEditingItem({
    ...item,
    _original_opening_stock: Number(item.opening_stock || 0),
    _original_current_stock: Number(item.current_stock || 0)
  });

  setFormData({
    ...item,
    purchase_price: Number(item.purchase_price || 0),
    sale_price: Number(item.sale_price || 0),
    mrp: Number(item.mrp || 0),
    gst_rate: Number(item.gst_rate || 18),
    cess_rate: Number(item.cess_rate || 0),
    opening_stock: Number(item.opening_stock || 0),
    current_stock: Number(item.current_stock || 0),
    reorder_level: Number(item.reorder_level || 0),
    is_service: !!item.is_service,
    is_active: item.is_active !== false
  });

  setShowForm(true);
};

const handleSubmit = async (e) => {
  e.preventDefault();

const payload = {
  id: editingItem?.id || null,
    name: formData.name,
    hsn_code: formData.hsn_code,
    category: formData.category,
    brand: formData.brand,
    sale_price: formData.sale_price,
    mrp: formData.mrp,
    gst_rate: formData.gst_rate,
    opening_stock: formData.opening_stock,
    current_stock: formData.current_stock
  };

  const url = editingItem
    ? "http://localhost:8000/api/products/update.php"
    : "http://localhost:8000/api/products/create.php";

  await fetch(url, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  queryClient.invalidateQueries({ queryKey: ["items"] });
  resetForm();
};
;


const handleDelete = async (item) => {
  if (!confirm("Delete this item?")) return;

  await fetch("http://localhost:8000/api/products/delete.php", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: item.id })
  });

  queryClient.invalidateQueries({ queryKey: ["items"] });
};




  // Get unique categories
  const categories = [...new Set(items.map(i => i.category).filter(Boolean))];

  // Filter items
  const filteredItems = items.filter(item => {
    const matchesSearch = !searchQuery || 
      item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.barcode?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const columns = [
    {
      header: 'Item',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
            <Package className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-medium text-[#0F1724]">{row.name}</p>
            <p className="text-xs text-gray-400">{row.code} {row.barcode && `• ${row.barcode}`}</p>
          </div>
        </div>
      )
    },
    {
      header: 'Category',
      accessor: 'category',
      render: (row) => row.category ? (
        <Badge variant="secondary" className="bg-gray-100 text-gray-700">{row.category}</Badge>
      ) : '-'
    },
    {
      header: 'HSN',
      accessor: 'hsn_code',
      render: (row) => row.hsn_code || '-'
    },
    {
      header: 'Stock',
      render: (row) => (
        <div className="text-right">
          <p className={`font-semibold ${row.current_stock <= row.reorder_level ? 'text-red-500' : 'text-[#0F1724]'}`}>
            {Number(row.current_stock || 0)} {row.unit}
          </p>
          {row.current_stock <= row.reorder_level && (
            <p className="text-xs text-red-400">Low stock</p>
          )}
        </div>
      ),
      className: 'text-right'
    },
    {
      header: 'Sale Price',
      render: (row) => (
        <div className="text-right">
          <p className="font-semibold text-emerald-600">
  ₹{Number(row.sale_price || 0).toFixed(2)}
</p>
          <p className="text-xs text-gray-400">GST {row.gst_rate}%</p>
        </div>
      ),
      className: 'text-right'
    },
    {
      header: 'Status',
      render: (row) => (
        <Badge variant="secondary" className={row.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}>
          {row.is_active ? 'Active' : 'Inactive'}
        </Badge>
      )
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => { e.stopPropagation(); handleEdit(row); }}
            className="h-8 w-8 text-gray-400 hover:text-emerald-600"
          >
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => { e.stopPropagation(); handleDelete(row); }}
            className="h-8 w-8 text-gray-400 hover:text-red-600"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
      className: 'text-right'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#0F1724]">Items Master</h1>
          <p className="text-gray-500 mt-1">Manage your products and services inventory</p>
        </div>
        <div className="flex gap-3">
          <ImportButton 
            entityName="items"
            templateColumns={['name', 'code', 'barcode', 'hsn_code', 'category', 'brand', 'unit', 'purchase_price', 'sale_price', 'mrp', 'gst_rate', 'opening_stock', 'reorder_level']}
            onImport={async (records) => {
              for (const record of records) {
                await base44.entities.Item.create({
                  ...record,
                  purchase_price: parseFloat(record.purchase_price) || 0,
                  sale_price: parseFloat(record.sale_price) || 0,
                  mrp: parseFloat(record.mrp) || 0,
                  gst_rate: parseFloat(record.gst_rate) || 18,
                  opening_stock: parseFloat(record.opening_stock) || 0,
                  current_stock: parseFloat(record.opening_stock) || 0,
                  reorder_level: parseFloat(record.reorder_level) || 0,
                  is_active: true
                });
              }
              queryClient.invalidateQueries({ queryKey: ['items'] });
              alert(`Successfully imported ${records.length} items`);
            }}
          />
          <ExportButton
            data={items}
            filename="items"
            columns={[
              { header: 'Name', accessor: 'name' },
              { header: 'Code', accessor: 'code' },
              { header: 'Barcode', accessor: 'barcode' },
              { header: 'HSN', accessor: 'hsn_code' },
              { header: 'Category', accessor: 'category' },
              { header: 'Brand', accessor: 'brand' },
              { header: 'Unit', accessor: 'unit' },
              { header: 'Purchase Price', accessor: 'purchase_price' },
              { header: 'Sale Price', accessor: 'sale_price' },
              { header: 'MRP', accessor: 'mrp' },
              { header: 'GST Rate', accessor: 'gst_rate' },
              { header: 'Current Stock', accessor: 'current_stock' },
              { header: 'Reorder Level', accessor: 'reorder_level' }
            ]}
          />
          <Button 
            className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-lg shadow-emerald-500/20"
            onClick={() => setShowForm(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Item
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-[0_6px_18px_rgba(15,23,36,0.06)]">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search items by name, code or barcode..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-[#F7F9FA] border-0"
              />
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-full md:w-48 bg-[#F7F9FA] border-0">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Items Table */}
      <Card className="border-0 shadow-[0_6px_18px_rgba(15,23,36,0.06)]">
        <CardContent className="p-0">
          <DataTable
  columns={columns}
  data={filteredItems}
  isLoading={isLoading}
  searchable={false}
/>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
     <Dialog open={!!editingItem || showForm} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {editingItem ? 'Update Item' : 'Add Item'}

            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <h3 className="font-semibold text-[#0F1724] flex items-center gap-2">
                <Package className="w-4 h-4" /> Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label>Item Name *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter item name"
                    required
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label>Item Code / SKU</Label>
                  <Input
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="e.g., SKU001"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label>Barcode</Label>
                  <div className="relative mt-1.5">
                    <Input
                      value={formData.barcode}
                      onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                      placeholder="Scan or enter barcode"
                      className="pr-10"
                    />
                    <Barcode className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  </div>
                </div>
                <div>
                  <Label>Category</Label>
                  <Input
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="e.g., Electronics"
                    className="mt-1.5"
                    list="categories"
                  />
                  <datalist id="categories">
                    {categories.map(cat => <option key={cat} value={cat} />)}
                  </datalist>
                </div>
                <div>
                  <Label>Brand</Label>
                  <Input
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    placeholder="e.g., Samsung"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label>HSN/SAC Code</Label>
                  <Input
                    value={formData.hsn_code}
                    onChange={(e) => setFormData({ ...formData, hsn_code: e.target.value })}
                    placeholder="e.g., 8471"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label>Unit of Measure</Label>
                  <Select 
                    value={formData.unit} 
                    onValueChange={(v) => setFormData({ ...formData, unit: v })}
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {UNITS.map(unit => (
                        <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div className="space-y-4">
              <h3 className="font-semibold text-[#0F1724]">Pricing & Tax</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Purchase Price</Label>
                  <Input
                    type="number"
                    value={formData.purchase_price}
                    onChange={(e) => setFormData({ ...formData, purchase_price: parseFloat(e.target.value) || 0 })}
                    min="0"
                    step="0.01"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label>Sale Price *</Label>
                  <Input
                    type="number"
                    value={formData.sale_price}
                    onChange={(e) => setFormData({ ...formData, sale_price: parseFloat(e.target.value) || 0 })}
                    min="0"
                    step="0.01"
                    required
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label>MRP</Label>
                  <Input
                    type="number"
                    value={formData.mrp}
                    onChange={(e) => setFormData({ ...formData, mrp: parseFloat(e.target.value) || 0 })}
                    min="0"
                    step="0.01"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label>GST Rate (%)</Label>
                  <Select 
                    value={String(formData.gst_rate)} 
                    onValueChange={(v) => setFormData({ ...formData, gst_rate: parseFloat(v) })}
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {GST_RATES.map(rate => (
                        <SelectItem key={rate} value={String(rate)}>{rate}%</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Cess Rate (%)</Label>
                  <Input
                    type="number"
                    value={formData.cess_rate}
                    onChange={(e) => setFormData({ ...formData, cess_rate: parseFloat(e.target.value) || 0 })}
                    min="0"
                    step="0.01"
                    className="mt-1.5"
                  />
                </div>
              </div>
            </div>

            {/* Stock */}
            <div className="space-y-4">
              <h3 className="font-semibold text-[#0F1724]">Stock Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Opening Stock</Label>
                  <Input
  type="number"
  value={formData.opening_stock}
  onChange={(e) => {
    const newOpening = parseFloat(e.target.value) || 0;

    if (editingItem) {
      const diff = newOpening - editingItem._original_opening_stock;
      setFormData(prev => ({
        ...prev,
        opening_stock: newOpening,
        current_stock: editingItem._original_current_stock + diff
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        opening_stock: newOpening,
        current_stock: newOpening   // for new item
      }));
    }
  }}
  min="0"
  className="mt-1.5"
/><p className="text-xs text-gray-500 mt-1">
  Editing this will auto-adjust current stock.
</p>
                </div>
                <div>
                  <Label>Reorder Level</Label>
                  <Input
                    type="number"
                    value={formData.reorder_level}
                    onChange={(e) => setFormData({ ...formData, reorder_level: parseFloat(e.target.value) || 0 })}
                    min="0"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label>Godown / Location</Label>
                  <Input
                    value={formData.godown}
                    onChange={(e) => setFormData({ ...formData, godown: e.target.value })}
                    placeholder="Main"
                    className="mt-1.5"
                  />
                </div>
              </div>
            </div>

            {/* Settings */}
            <div className="flex items-center gap-8 pt-2">
              <div className="flex items-center gap-3">
                <Switch
                  checked={formData.is_service}
                  onCheckedChange={(v) => setFormData({ ...formData, is_service: v })}
                />
                <Label className="cursor-pointer">This is a service (no stock tracking)</Label>
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(v) => setFormData({ ...formData, is_active: v })}
                />
                <Label className="cursor-pointer">Active</Label>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancel
              </Button>
 <Button 
  type="submit" 
  className="bg-gradient-to-r from-emerald-500 to-green-600"
  disabled={false}
>
  {editingItem ? 'Update Item' : 'Add Item'}
</Button>

            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
