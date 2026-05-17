import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Building2,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  Upload,
  Save,
  Star
} from 'lucide-react';
import { format } from 'date-fns';

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
  { code: '19', name: 'West Bengal' },
  { code: '21', name: 'Odisha' },
  { code: '22', name: 'Chhattisgarh' },
  { code: '23', name: 'Madhya Pradesh' },
  { code: '24', name: 'Gujarat' },
  { code: '27', name: 'Maharashtra' },
  { code: '29', name: 'Karnataka' },
  { code: '30', name: 'Goa' },
  { code: '32', name: 'Kerala' },
  { code: '33', name: 'Tamil Nadu' },
  { code: '36', name: 'Telangana' },
  { code: '37', name: 'Andhra Pradesh' },
];

const emptyCompany = {
  name: '',
  gstin: '',
  pan: '',
  address: '',
  city: '',
  state: '',
  state_code: '',
  pincode: '',
  phone: '',
  email: '',
  logo_url: '',
  bank_name: '',
  bank_account: '',
  bank_ifsc: '',
  invoice_prefix: 'INV',
  invoice_counter: 1,
  financial_year_start: '',
  composition_scheme: false,
  is_active: true
};

export default function CompanyManagement() {
  const [showForm, setShowForm] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [formData, setFormData] = useState(emptyCompany);
  const [saved, setSaved] = useState(false);
  
  const queryClient = useQueryClient();

  const { data: companies = [], isLoading } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Company.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      resetForm();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Company.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      resetForm();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Company.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['companies'] }),
  });

  const resetForm = () => {
    setFormData(emptyCompany);
    setEditingCompany(null);
    setShowForm(false);
  };

  const handleEdit = (company) => {
    setEditingCompany(company);
    setFormData({
      name: company.name || '',
      gstin: company.gstin || '',
      pan: company.pan || '',
      address: company.address || '',
      city: company.city || '',
      state: company.state || '',
      state_code: company.state_code || '',
      pincode: company.pincode || '',
      phone: company.phone || '',
      email: company.email || '',
      logo_url: company.logo_url || '',
      bank_name: company.bank_name || '',
      bank_account: company.bank_account || '',
      bank_ifsc: company.bank_ifsc || '',
      invoice_prefix: company.invoice_prefix || 'INV',
      invoice_counter: company.invoice_counter || 1,
      financial_year_start: company.financial_year_start || '',
      composition_scheme: company.composition_scheme || false,
      is_active: company.is_active !== false
    });
    setShowForm(true);
  };

  const handleStateChange = (stateCode) => {
    const state = STATES.find(s => s.code === stateCode);
    setFormData({
      ...formData,
      state: state?.name || '',
      state_code: stateCode
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingCompany) {
      updateMutation.mutate({ id: editingCompany.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const result = await base44.integrations.Core.UploadFile({ file });
      setFormData({ ...formData, logo_url: result.file_url });
    }
  };

  const handleDelete = (company) => {
    if (confirm(`Are you sure you want to delete "${company.name}"?`)) {
      deleteMutation.mutate(company.id);
    }
  };

  const setActiveCompany = async (company) => {
    // Deactivate all, then activate selected
    for (const c of companies) {
      if (c.id !== company.id && c.is_active) {
        await base44.entities.Company.update(c.id, { is_active: false });
      }
    }
    await base44.entities.Company.update(company.id, { is_active: true });
    queryClient.invalidateQueries({ queryKey: ['companies'] });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#0F1724]">Company Management</h1>
          <p className="text-gray-500 mt-1">Manage multiple companies and their settings</p>
        </div>
        <div className="flex gap-3">
          {saved && (
            <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-4 py-2 rounded-lg">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Saved!</span>
            </div>
          )}
          <Button onClick={() => { resetForm(); setShowForm(true); }} className="bg-gradient-to-r from-emerald-500 to-green-600">
            <Plus className="w-4 h-4 mr-2" />
            Add Company
          </Button>
        </div>
      </div>

      {/* Company Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {companies.map(company => (
          <Card key={company.id} className={`border-0 shadow-[0_6px_18px_rgba(15,23,36,0.06)] relative overflow-hidden ${company.is_active ? 'ring-2 ring-emerald-500' : ''}`}>
            {company.is_active && (
              <div className="absolute top-0 right-0 bg-emerald-500 text-white text-xs px-3 py-1 rounded-bl-lg">
                Active
              </div>
            )}
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-xl bg-[#F7F9FA] flex items-center justify-center overflow-hidden">
                  {company.logo_url ? (
                    <img src={company.logo_url} alt={company.name} className="w-full h-full object-contain" />
                  ) : (
                    <Building2 className="w-8 h-8 text-gray-300" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-[#0F1724] truncate">{company.name}</h3>
                  {company.gstin && (
                    <p className="text-xs text-gray-400 font-mono mt-1">{company.gstin}</p>
                  )}
                  <p className="text-sm text-gray-500 mt-1">{company.city}, {company.state}</p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                <div className="flex gap-1">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleEdit(company)}
                    className="text-gray-500 hover:text-blue-600"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleDelete(company)}
                    className="text-gray-500 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                {!company.is_active && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setActiveCompany(company)}
                    className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                  >
                    <Star className="w-4 h-4 mr-1" />
                    Set Active
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {companies.length === 0 && (
          <Card className="border-0 shadow-sm col-span-full">
            <CardContent className="py-12 text-center">
              <Building2 className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <h3 className="font-medium text-[#0F1724]">No companies yet</h3>
              <p className="text-sm text-gray-500 mt-1">Add your first company to get started</p>
              <Button onClick={() => setShowForm(true)} className="mt-4 bg-gradient-to-r from-emerald-500 to-green-600">
                <Plus className="w-4 h-4 mr-2" />
                Add Company
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Company Form Dialog */}
      <Dialog open={showForm} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white">
          <DialogHeader>
            <DialogTitle>{editingCompany ? 'Edit Company' : 'Add New Company'}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6 py-4">
            <Tabs defaultValue="business">
              <TabsList className="bg-[#F7F9FA] p-1 mb-4">
                <TabsTrigger value="business" className="data-[state=active]:bg-white">Business</TabsTrigger>
                <TabsTrigger value="tax" className="data-[state=active]:bg-white">Tax & GST</TabsTrigger>
                <TabsTrigger value="bank" className="data-[state=active]:bg-white">Bank</TabsTrigger>
                <TabsTrigger value="invoice" className="data-[state=active]:bg-white">Invoice</TabsTrigger>
              </TabsList>

              <TabsContent value="business" className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-20 h-20 rounded-xl bg-[#F7F9FA] border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden">
                    {formData.logo_url ? (
                      <img src={formData.logo_url} alt="Logo" className="w-full h-full object-contain" />
                    ) : (
                      <Building2 className="w-6 h-6 text-gray-300" />
                    )}
                  </div>
                  <div>
                    <Label className="text-sm">Logo</Label>
                    <label className="mt-1 inline-flex items-center gap-2 px-3 py-1.5 bg-[#F7F9FA] rounded-lg cursor-pointer hover:bg-gray-100 text-sm">
                      <Upload className="w-4 h-4" />
                      Upload
                      <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label>Company Name *</Label>
                    <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required className="mt-1" />
                  </div>
                  <div className="col-span-2">
                    <Label>Address</Label>
                    <Input value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="mt-1" />
                  </div>
                  <div>
                    <Label>City</Label>
                    <Input value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} className="mt-1" />
                  </div>
                  <div>
                    <Label>State</Label>
                    <Select value={formData.state_code} onValueChange={handleStateChange}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {STATES.map(s => <SelectItem key={s.code} value={s.code}>{s.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Pincode</Label>
                    <Input value={formData.pincode} onChange={(e) => setFormData({ ...formData, pincode: e.target.value })} maxLength={6} className="mt-1" />
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="mt-1" />
                  </div>
                  <div className="col-span-2">
                    <Label>Email</Label>
                    <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="mt-1" />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="tax" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>GSTIN</Label>
                    <Input value={formData.gstin} onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })} maxLength={15} className="mt-1 font-mono" />
                  </div>
                  <div>
                    <Label>PAN</Label>
                    <Input value={formData.pan} onChange={(e) => setFormData({ ...formData, pan: e.target.value.toUpperCase() })} maxLength={10} className="mt-1 font-mono" />
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-xl">
                  <Switch checked={formData.composition_scheme} onCheckedChange={(v) => setFormData({ ...formData, composition_scheme: v })} />
                  <Label>Composition Scheme</Label>
                </div>
              </TabsContent>

              <TabsContent value="bank" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label>Bank Name</Label>
                    <Input value={formData.bank_name} onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })} className="mt-1" />
                  </div>
                  <div>
                    <Label>Account Number</Label>
                    <Input value={formData.bank_account} onChange={(e) => setFormData({ ...formData, bank_account: e.target.value })} className="mt-1 font-mono" />
                  </div>
                  <div>
                    <Label>IFSC Code</Label>
                    <Input value={formData.bank_ifsc} onChange={(e) => setFormData({ ...formData, bank_ifsc: e.target.value.toUpperCase() })} className="mt-1 font-mono" />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="invoice" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Invoice Prefix</Label>
                    <Input value={formData.invoice_prefix} onChange={(e) => setFormData({ ...formData, invoice_prefix: e.target.value.toUpperCase() })} className="mt-1" />
                  </div>
                  <div>
                    <Label>Starting Number</Label>
                    <Input type="number" value={formData.invoice_counter} onChange={(e) => setFormData({ ...formData, invoice_counter: parseInt(e.target.value) || 1 })} min={1} className="mt-1" />
                  </div>
                  <div>
                    <Label>Financial Year Start</Label>
                    <Input type="date" value={formData.financial_year_start} onChange={(e) => setFormData({ ...formData, financial_year_start: e.target.value })} className="mt-1" />
                  </div>
                </div>
                <div className="p-3 bg-[#F7F9FA] rounded-lg">
                  <p className="text-xs text-gray-500">Preview</p>
                  <p className="font-mono text-emerald-600">{formData.invoice_prefix}/{String(formData.invoice_counter).padStart(5, '0')}</p>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
              <Button type="submit" className="bg-gradient-to-r from-emerald-500 to-green-600">
                <Save className="w-4 h-4 mr-2" />
                {editingCompany ? 'Update' : 'Create'} Company
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}