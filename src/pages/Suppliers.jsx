import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import DataTable from '@/components/ui/DataTable';
import StatsCard from '@/components/ui/StatsCard';
import { ExportButton, ImportButton } from '@/components/ui/ExportImportButtons';
import { Plus, Edit, Trash2, TrendingUp, Users, Building2, DollarSign } from 'lucide-react';

const indianStates = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 
  'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 
  'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 
  'Uttarakhand', 'West Bengal'
];

export default function Suppliers() {
  const [showDialog, setShowDialog] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    type: 'supplier',
    gstin: '',
    gst_type: 'registered',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    opening_balance: 0,
    current_balance: 0,
    is_active: true
  });

  const queryClient = useQueryClient();

  const { data: suppliers = [], isLoading } = useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
  const res = await fetch('http://localhost:8000/api/suppliers/list.php', {
    credentials: 'include'
  });
  const json = await res.json();

  return (json.data || []).map(s => ({
    id: Number(s.id),
    name: s.name,
    gst_type: s.gst_type || 'registered',
    phone: s.phone,
    gstin: s.gstin,
    email: s.email,
    address: s.address,
    city: s.city,
    state: s.state,
    pincode: s.pincode,
    opening_balance: Number(s.opening_balance || 0),
    current_balance: Number(s.current_balance || 0),
    is_active: Number(s.is_active) === 1
  }));
}
  });



 const createSupplierMutation = useMutation({
  mutationFn: async (data) => {
    const res = await fetch('http://localhost:8000/api/suppliers/create.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, company_id: 1 })
    });
    return res.json();
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    setShowDialog(false);
    resetForm();
  }
});

const updateSupplierMutation = useMutation({
  mutationFn: async ({ id, data }) => {
    const res = await fetch('http://localhost:8000/api/suppliers/update.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, id })
    });
    return res.json();
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    setShowDialog(false);
    resetForm();
  }
});

const deleteSupplierMutation = useMutation({
  mutationFn: async (id) => {
    const res = await fetch('http://localhost:8000/api/suppliers/delete.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    return res.json();
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['suppliers'] });
  }
});

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'supplier',
      gstin: '',
      gst_type: 'registered',
      phone: '',
      email: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
      opening_balance: 0,
      current_balance: 0,
      is_active: true
    });
    setEditingSupplier(null);
  };

const handleSubmit = (e) => {
  e.preventDefault();

  // 👉 GST validation
 if (formData.gst_type === 'registered') {
  if (!GST_REGEX.test(formData.gstin)) {
    setGstError('Invalid GSTIN format');
    return;
  } else {
    setGstError('');
  }
}
  if (editingSupplier) {
    updateSupplierMutation.mutate({
      id: editingSupplier.id,
      data: formData
    });
  } else {
    createSupplierMutation.mutate(formData);
  }
};
const [gstError, setGstError] = useState('');

  const handleEdit = (supplier) => {
    setEditingSupplier(supplier);
    setFormData({
  name: supplier.name || '',
  type: 'supplier',
  gstin: supplier.gstin || '',
  gst_type: supplier.gst_type || 'registered',
  phone: supplier.phone || '',
  email: supplier.email || '',
  address: supplier.address || '',
  city: supplier.city || '',
  state: supplier.state || '',
  pincode: supplier.pincode || '',
  opening_balance: supplier.opening_balance || 0,
  current_balance: supplier.current_balance || 0,
  is_active: supplier.is_active ?? true
});
    setShowDialog(true);
  };

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this supplier?')) {
      deleteSupplierMutation.mutate(id);
    }
  };

const handleImport = async (records) => {
  try {
    await Promise.all(
      records.map(r =>
        fetch('http://localhost:8000/api/suppliers/list.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...r,
            company_id: 1
          })
        })
      )
    );

    queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    alert(`Imported ${records.length} suppliers successfully!`);
  } catch (error) {
    alert('Error importing suppliers');
  }
};

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    supplier.gstin?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    supplier.phone?.includes(searchQuery)
  );

  const stats = {
    total: suppliers.length,
    registered: suppliers.filter(s => s.gst_type === 'registered').length,
    totalPayable: suppliers.reduce((sum, s) => sum + (s.current_balance || 0), 0)
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  const columns = [
    { header: 'Name', accessor: 'name' },
    { header: 'GSTIN', accessor: 'gstin', cellClassName: 'font-mono text-xs' },
    { header: 'Phone', accessor: 'phone' },
    { header: 'City', accessor: 'city' },
    { header: 'State', accessor: 'state' },
    { header: 'Balance', render: (row) => (
      <span className={row.current_balance > 0 ? 'text-red-600 font-medium' : 'text-gray-600'}>
        {formatCurrency(row.current_balance)}
      </span>
    ), cellClassName: 'text-right' },
    { header: 'Status', render: (row) => (
      <Badge className={row.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'}>
        {row.is_active ? 'Active' : 'Inactive'}
      </Badge>
    )},
    { header: 'Actions', render: (row) => (
      <div className="flex gap-2">
        <Button variant="ghost" size="icon" onClick={() => handleEdit(row)}>
          <Edit className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => handleDelete(row.id)} className="text-red-500">
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    )}
  ];
  const GST_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#0F1724]">Suppliers</h1>
          <p className="text-gray-500 mt-1">Manage your vendor and supplier information</p>
        </div>
        <div className="flex gap-3">
          <ImportButton
            onImport={handleImport}
            templateColumns={['name', 'gstin', 'phone', 'email', 'address', 'city', 'state', 'pincode']}
            entityName="suppliers"
          />
          <ExportButton data={suppliers} filename="suppliers" columns={columns} />
          <Button onClick={() => { resetForm(); setShowDialog(true); }} className="bg-emerald-500 hover:bg-emerald-600">
            <Plus className="w-4 h-4 mr-2" />
            Add Supplier
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard
          title="Total Suppliers"
          value={stats.total}
          icon={Users}
          gradient="from-emerald-500 to-green-600"
        />
        <StatsCard
          title="GST Registered"
          value={stats.registered}
          icon={Building2}
          gradient="from-blue-500 to-indigo-600"
        />
        <StatsCard
          title="Total Payable"
          value={formatCurrency(stats.totalPayable)}
          icon={DollarSign}
          gradient="from-red-500 to-rose-600"
        />
        <StatsCard
          title="Active This Month"
          value={stats.total}
          icon={TrendingUp}
          gradient="from-purple-500 to-pink-600"
        />
      </div>

      {/* Suppliers Table */}
      <Card className="border-0 shadow-[0_6px_18px_rgba(15,23,36,0.06)]">
        <CardHeader className="border-b border-gray-100">
          <CardTitle>All Suppliers</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={filteredSuppliers}
            isLoading={isLoading}
            searchable={true}
            searchPlaceholder="Search suppliers..."
            onSearch={setSearchQuery}
            searchValue={searchQuery}
            emptyMessage="No suppliers found"
          />
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Supplier Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label>GST Type</Label>
                <Select
  value={formData.gst_type || 'registered'}
  onValueChange={(v) =>
    setFormData({
      ...formData,
      gst_type: v,
      gstin: v === 'registered' ? formData.gstin : '' // 👈 clear if not registered
    })
  }
> 
<SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="registered">Registered</SelectItem>
                    <SelectItem value="unregistered">Unregistered</SelectItem>
                    <SelectItem value="composition">Composition</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>GSTIN</Label>
                <Input
  value={formData.gstin || ''}
  disabled={formData.gst_type !== 'registered'}
  onChange={(e) => setFormData({
    ...formData,
    gstin: e.target.value.toUpperCase()
  })}
  placeholder={formData.gst_type !== 'registered' ? 'GST not required' : 'Enter GSTIN'}
  className="mt-1"
/>{gstError && (
  <p className="text-red-500 text-xs mt-1">{gstError}</p>
)}
              </div>
              <div>
                <Label>Phone</Label>
                <Input
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="mt-1"
                />
              </div>
              <div className="col-span-2">
                <Label>Address</Label>
                <Input
                  value={formData.address || ''}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>City</Label>
                <Input
                  value={formData.city || ''}
                  onChange={(e) => setFormData({...formData, city: e.target.value})}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>State</Label>
                <Select value={formData.state || ''} onValueChange={(v) => setFormData({...formData, state: v})}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {indianStates.map(state => (
                      <SelectItem key={state} value={state}>{state}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Pincode</Label>
                <Input
                  value={formData.pincode || ''}
                  onChange={(e) => setFormData({...formData, pincode: e.target.value})}
                  maxLength={6}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Opening Balance</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.opening_balance || ''}
                  onChange={(e) => setFormData({...formData, opening_balance: parseFloat(e.target.value) || 0})}
                  className="mt-1"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-emerald-500 hover:bg-emerald-600">
                {editingSupplier ? 'Update' : 'Create'} Supplier
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
  
}