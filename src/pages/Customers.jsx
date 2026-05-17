import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import StatsCard from '@/components/ui/StatsCard';
import { DollarSign, TrendingUp } from 'lucide-react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DataTable from '@/components/ui/DataTable';
import {
  Plus,
  Users,
  Edit2,
  Trash2,
  Search,
  Filter,
  Phone,
  Mail,
  MapPin,
  Building2
} from 'lucide-react';
import { ExportButton, ImportButton } from '@/components/ui/ExportImportButtons';

const STATES = [
  { code: '01', name: 'Jammu & Kashmir' },
  { code: '02', name: 'Himachal Pradesh' },
  { code: '03', name: 'Punjab' },
  { code: '04', name: 'Chandigarh' },
  { code: '05', name: 'Uttarakhand' },
  { code: '06', name: 'Haryana' },
  { code: '07', name: 'Delhi' },
  { code: '08', name: 'Rajasthan' },
  { code: '09', name: 'Uttar Pradesh' },
  { code: '10', name: 'Bihar' },
  { code: '11', name: 'Sikkim' },
  { code: '12', name: 'Arunachal Pradesh' },
  { code: '13', name: 'Nagaland' },
  { code: '14', name: 'Manipur' },
  { code: '15', name: 'Mizoram' },
  { code: '16', name: 'Tripura' },
  { code: '17', name: 'Meghalaya' },
  { code: '18', name: 'Assam' },
  { code: '19', name: 'West Bengal' },
  { code: '20', name: 'Jharkhand' },
  { code: '21', name: 'Odisha' },
  { code: '22', name: 'Chhattisgarh' },
  { code: '23', name: 'Madhya Pradesh' },
  { code: '24', name: 'Gujarat' },
  { code: '26', name: 'Dadra & Nagar Haveli and Daman & Diu' },
  { code: '27', name: 'Maharashtra' },
  { code: '29', name: 'Karnataka' },
  { code: '30', name: 'Goa' },
  { code: '31', name: 'Lakshadweep' },
  { code: '32', name: 'Kerala' },
  { code: '33', name: 'Tamil Nadu' },
  { code: '34', name: 'Puducherry' },
  { code: '35', name: 'Andaman & Nicobar Islands' },
  { code: '36', name: 'Telangana' },
  { code: '37', name: 'Andhra Pradesh' },
  { code: '38', name: 'Ladakh' },
];

const GST_TYPES = [
  { value: 'registered', label: 'Registered' },
  { value: 'unregistered', label: 'Unregistered' },
  { value: 'composition', label: 'Composition' },
  { value: 'consumer', label: 'Consumer' },
  { value: 'overseas', label: 'Overseas' },
];

export default function Customers() {
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    name: '',
    type: 'customer',
    gstin: '',
    pan: '',
    gst_type: 'unregistered',
    address: '',
    city: '',
    state: '',
    state_code: '',
    pincode: '',
    phone: '',
    email: '',
    contact_person: '',
    credit_limit: 0,
    credit_days: 0,
    opening_balance: 0,
    is_active: true
  });

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
  const res = await fetch('http://localhost:8000/api/customers/list.php', {
    credentials: 'include'
  });
  const json = await res.json();

  return (json.data || []).map(c => ({
    id: Number(c.id),
    name: c.name,
    phone: c.phone,
    gstin: c.gstin,
    state_code: c.state_code,
    type: c.customer_type || 'customer',
    address: c.address,
    is_active: true,
    current_balance: 0
  }));
}
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
  const res = await fetch('http://localhost:8000/api/customers/create.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: data.name,
      phone: data.phone,
      gstin: data.gstin,
      state_code: data.state_code,
      customer_type: data.type,
      address: data.address,
      company_id: 1
    })
  });

  return await res.json();
}
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Customer.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Customer.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'customer',
      gstin: '',
      pan: '',
      gst_type: 'unregistered',
      address: '',
      city: '',
      state: '',
      state_code: '',
      pincode: '',
      phone: '',
      email: '',
      contact_person: '',
      credit_limit: 0,
      credit_days: 0,
      opening_balance: 0,
      is_active: true
    });
    setEditingCustomer(null);
    setShowForm(false);
  };

  const handleEdit = (customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name || '',
      type: customer.type || 'customer',
      gstin: customer.gstin || '',
      pan: customer.pan || '',
      gst_type: customer.gst_type || 'unregistered',
      address: customer.address || '',
      city: customer.city || '',
      state: customer.state || '',
      state_code: customer.state_code || '',
      pincode: customer.pincode || '',
      phone: customer.phone || '',
      email: customer.email || '',
      contact_person: customer.contact_person || '',
      credit_limit: customer.credit_limit || 0,
      credit_days: customer.credit_days || 0,
      opening_balance: customer.opening_balance || 0,
      is_active: customer.is_active !== false
    });
    setShowForm(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...formData,
      current_balance: formData.opening_balance
    };
    
    if (editingCustomer) {
      updateMutation.mutate({ id: editingCustomer.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (customer) => {
    if (confirm('Are you sure you want to delete this customer?')) {
      deleteMutation.mutate(customer.id);
    }
  };

  const handleStateChange = (stateCode) => {
    const state = STATES.find(s => s.code === stateCode);
    setFormData({
      ...formData,
      state: state?.name || '',
      state_code: stateCode
    });
  };

  // Filter customers
  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = !searchQuery || 
      customer.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.gstin?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone?.includes(searchQuery);
    const matchesType = filterType === 'all' || customer.type === filterType;
    return matchesSearch && matchesType;
  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const columns = [
    {
      header: 'Customer',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            row.type === 'supplier' 
              ? 'bg-gradient-to-br from-purple-500 to-indigo-600' 
              : row.type === 'both'
              ? 'bg-gradient-to-br from-amber-500 to-orange-600'
              : 'bg-gradient-to-br from-emerald-500 to-green-600'
          }`}>
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-medium text-[#0F1724]">{row.name}</p>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              {row.phone && <span>{row.phone}</span>}
              {row.city && <span>• {row.city}</span>}
            </div>
          </div>
        </div>
      )
    },
    {
      header: 'Type',
      render: (row) => (
        <Badge variant="secondary" className={
          row.type === 'supplier' 
            ? 'bg-purple-100 text-purple-700' 
            : row.type === 'both'
            ? 'bg-amber-100 text-amber-700'
            : 'bg-emerald-100 text-emerald-700'
        }>
          {row.type}
        </Badge>
      )
    },
    {
      header: 'GSTIN',
      render: (row) => (
        <div>
          <p className="font-mono text-sm">{row.gstin || '-'}</p>
          <p className="text-xs text-gray-400 capitalize">{row.gst_type}</p>
        </div>
      )
    },
    {
      header: 'Balance',
      render: (row) => (
        <p className={`font-semibold ${row.current_balance > 0 ? 'text-red-500' : row.current_balance < 0 ? 'text-emerald-500' : 'text-gray-500'}`}>
          {formatCurrency(Math.abs(row.current_balance || 0))}
          {row.current_balance > 0 && <span className="text-xs font-normal ml-1">Dr</span>}
          {row.current_balance < 0 && <span className="text-xs font-normal ml-1">Cr</span>}
        </p>
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
  const stats = {
  total: customers.length,
  registered: customers.filter(c => c.gstin).length,
  totalReceivable: customers.reduce(
    (sum, c) => sum + (c.current_balance > 0 ? c.current_balance : 0),
    0
  ),
  totalPayable: customers.reduce(
    (sum, c) => sum + (c.current_balance < 0 ? Math.abs(c.current_balance) : 0),
    0
  )
};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#0F1724]">Customers </h1>
          <p className="text-gray-500 mt-1">Manage your business contacts and their details</p>
        </div>
        <div className="flex gap-3">
          <ImportButton 
            entityName="customers"
            templateColumns={['name', 'type', 'gstin', 'pan', 'gst_type', 'address', 'city', 'state', 'state_code', 'pincode', 'phone', 'email', 'contact_person', 'credit_limit', 'credit_days', 'opening_balance']}
            onImport={async (records) => {
              for (const record of records) {
                await base44.entities.Customer.create({
                  ...record,
                  type: record.type || 'customer',
                  gst_type: record.gst_type || 'unregistered',
                  credit_limit: parseFloat(record.credit_limit) || 0,
                  credit_days: parseInt(record.credit_days) || 0,
                  opening_balance: parseFloat(record.opening_balance) || 0,
                  current_balance: parseFloat(record.opening_balance) || 0,
                  is_active: true
                });
              }
              queryClient.invalidateQueries({ queryKey: ['customers'] });
              alert(`Successfully imported ${records.length} customers`);
            }}
          />
          <ExportButton
            data={customers}
            filename="customers"
            columns={[
              { header: 'Name', accessor: 'name' },
              { header: 'Type', accessor: 'type' },
              { header: 'GSTIN', accessor: 'gstin' },
              { header: 'PAN', accessor: 'pan' },
              { header: 'GST Type', accessor: 'gst_type' },
              { header: 'Phone', accessor: 'phone' },
              { header: 'Email', accessor: 'email' },
              { header: 'City', accessor: 'city' },
              { header: 'State', accessor: 'state' },
              { header: 'Current Balance', accessor: 'current_balance' }
            ]}
          />
          <Button 
            className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-lg shadow-emerald-500/20"
            onClick={() => setShowForm(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Customer
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
  <StatsCard
    title="Total Customers"
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
    title="Total Receivable"
    value={formatCurrency(stats.totalReceivable)}
    icon={DollarSign}
    gradient="from-emerald-500 to-green-600"
  />

  <StatsCard
    title="Total Payable"
    value={formatCurrency(stats.totalPayable)}
    icon={TrendingUp}
    gradient="from-red-500 to-rose-600"
  />
</div>

      {/* Filters */}
      <Card className="border-0 shadow-[0_6px_18px_rgba(15,23,36,0.06)]">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by name, GSTIN or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-[#F7F9FA] border-0"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full md:w-48 bg-[#F7F9FA] border-0">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="customer">Customers</SelectItem>
                <SelectItem value="supplier">Suppliers</SelectItem>
                <SelectItem value="both">Both</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Customers Table */}
      <Card className="border-0 shadow-[0_6px_18px_rgba(15,23,36,0.06)]">
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={filteredCustomers}
            isLoading={isLoading}
            searchable={false}
            onRowClick={handleEdit}
            emptyMessage="No customers found. Add your first customer to get started."
          />
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="address">Address</TabsTrigger>
                <TabsTrigger value="credit">Credit & Balance</TabsTrigger>
              </TabsList>
              
              <TabsContent value="basic" className="space-y-4 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label>Party Name *</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter customer/supplier name"
                      required
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label>Party Type</Label>
                    <Select 
                      value={formData.type} 
                      onValueChange={(v) => setFormData({ ...formData, type: v })}
                    >
                      <SelectTrigger className="mt-1.5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="customer">Customer</SelectItem>
                        <SelectItem value="supplier">Supplier</SelectItem>
                        <SelectItem value="both">Both</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>GST Type</Label>
                    <Select 
                      value={formData.gst_type} 
                      onValueChange={(v) => setFormData({ ...formData, gst_type: v })}
                    >
                      <SelectTrigger className="mt-1.5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {GST_TYPES.map(type => (
                          <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>GSTIN</Label>
                    <Input
                      value={formData.gstin}
                      onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                      placeholder="e.g., 27AAAAA0000A1Z5"
                      maxLength={15}
                      className="mt-1.5 font-mono"
                    />
                  </div>
                  <div>
                    <Label>PAN</Label>
                    <Input
                      value={formData.pan}
                      onChange={(e) => setFormData({ ...formData, pan: e.target.value.toUpperCase() })}
                      placeholder="e.g., AAAAA0000A"
                      maxLength={10}
                      className="mt-1.5 font-mono"
                    />
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <div className="relative mt-1.5">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="e.g., 9876543210"
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Email</Label>
                    <div className="relative mt-1.5">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="e.g., contact@example.com"
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Contact Person</Label>
                    <Input
                      value={formData.contact_person}
                      onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                      placeholder="Contact person name"
                      className="mt-1.5"
                    />
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="address" className="space-y-4 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label>Address</Label>
                    <Input
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Street address"
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label>City</Label>
                    <Input
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="City"
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label>State</Label>
                    <Select 
                      value={formData.state_code} 
                      onValueChange={handleStateChange}
                    >
                      <SelectTrigger className="mt-1.5">
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent>
                        {STATES.map(state => (
                          <SelectItem key={state.code} value={state.code}>
                            {state.code} - {state.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Pincode</Label>
                    <Input
                      value={formData.pincode}
                      onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                      placeholder="e.g., 400001"
                      maxLength={6}
                      className="mt-1.5"
                    />
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="credit" className="space-y-4 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Credit Limit (₹)</Label>
                    <Input
                      type="number"
                      value={formData.credit_limit}
                      onChange={(e) => setFormData({ ...formData, credit_limit: parseFloat(e.target.value) || 0 })}
                      min="0"
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label>Credit Days</Label>
                    <Input
                      type="number"
                      value={formData.credit_days}
                      onChange={(e) => setFormData({ ...formData, credit_days: parseInt(e.target.value) || 0 })}
                      min="0"
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label>Opening Balance (₹)</Label>
                    <Input
                      type="number"
                      value={formData.opening_balance}
                      onChange={(e) => setFormData({ ...formData, opening_balance: parseFloat(e.target.value) || 0 })}
                      className="mt-1.5"
                      disabled={!!editingCustomer}
                    />
                    <p className="text-xs text-gray-400 mt-1">+ve = Receivable, -ve = Payable</p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-gradient-to-r from-emerald-500 to-green-600"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending ? 'Saving...' : editingCustomer ? 'Update' : 'Add Customer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}