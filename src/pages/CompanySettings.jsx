
import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Building2,
  Save,
  Upload,
  FileText,
  CreditCard,
  Settings,
  CheckCircle
} from 'lucide-react';
const API_BASE = 'http://localhost:8000/api';
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

export default function CompanySettings() {
  const queryClient = useQueryClient();
  const [saved, setSaved] = useState(false);
   const [showSuccessModal, setShowSuccessModal] = useState(false);

  const [formData, setFormData] = useState({
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
    bank_branch: '',
    bank_account: '',
    bank_ifsc: '',
    invoice_prefix: 'INV',
    invoice_counter: 1,
    financial_year_start: '',
    composition_scheme: false,
    is_active: true
  });

const { data: companies = [], isLoading } = useQuery({
  queryKey: ['companies'],
  queryFn: async () => {
    const res = await fetch(`${API_BASE}/company_settings.php`, {
      credentials: 'include',
    });

    const json = await res.json();
    return json.data ? [json.data] : [];
  },
});

  const company = companies[0];

  useEffect(() => {
    if (company) {
      setFormData({
        name: company.company_name || '',
        gstin: company.gstin || '',
        pan: company.pan || '',
        address: company.address || '',
        city: company.city || '',
        state: company.state || '',
        state_code: company.state_code || '',
        pincode: company.pincode || '',
        phone: company.phone || '',
        email: company.email || '',
        logo_url: company.logo_path || '',
        bank_name: company.bank_name || '',
        bank_branch: company.bank_branch || '',
        bank_account: company.account_number || '',
        bank_ifsc: company.ifsc || '',
        invoice_prefix: company.invoice_prefix_order || 'INV',
        invoice_counter: company.invoice_counter || 1,
        financial_year_start: company.financial_year_start || '',
        composition_scheme: !!company.composition_scheme,
        is_active: company.is_active !== 0
      });
    }
  }, [company]);

const saveMutation = useMutation({
  mutationFn: async (data) => {
    const res = await fetch(`${API_BASE}/company_settings.php`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const json = await res.json();

    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Failed to save company settings');
    }

    return json;
  },
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ['companies'] });

  setShowSuccessModal(true);

 setTimeout(() => {
  setShowSuccessModal(false);
}, 2200);
},
  onError: (error) => {
    alert(error.message || 'Failed to save settings');
  }
});

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
    saveMutation.mutate(formData);
  };

 const handleLogoUpload = async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;

  const formDataUpload = new FormData();
  formDataUpload.append("file", file);

  const res = await fetch("http://localhost:8000/api/upload_logo.php", {
    method: "POST",
    body: formDataUpload,
    credentials: "include",
  });

  const data = await res.json();
  console.log("UPLOAD RESULT:", data);

  if (data.success) {
    setFormData(prev => ({
      ...prev,
      logo_url: data.file_url
    }));
  } else {
    alert(data.message || "Upload failed");
  }
};

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#0F1724]">Company Settings</h1>
          <p className="text-gray-500 mt-1">Manage your business information and preferences</p>
        </div>
        {saved && (
          <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-4 py-2 rounded-lg">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">Settings saved!</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        <Tabs defaultValue="business" className="space-y-6">
          <TabsList className="bg-[#F7F9FA] p-1">
            <TabsTrigger value="business" className="data-[state=active]:bg-white">
              <Building2 className="w-4 h-4 mr-2" />
              Business Info
            </TabsTrigger>
            <TabsTrigger value="tax" className="data-[state=active]:bg-white">
              <FileText className="w-4 h-4 mr-2" />
              Tax & GST
            </TabsTrigger>
            <TabsTrigger value="bank" className="data-[state=active]:bg-white">
              <CreditCard className="w-4 h-4 mr-2" />
              Bank Details
            </TabsTrigger>
            <TabsTrigger value="invoice" className="data-[state=active]:bg-white">
              <Settings className="w-4 h-4 mr-2" />
              Invoice Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="business">
            <Card className="border-0 shadow-[0_6px_18px_rgba(15,23,36,0.06)]">
              <CardHeader>
                <CardTitle>Business Information</CardTitle>
                <CardDescription>Your company details that will appear on invoices</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-start gap-6">
                  <div className="w-24 h-24 rounded-xl bg-[#F7F9FA] border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden">
                    {formData.logo_url ? (
                      <img 
  src={`http://localhost:8000/${formData.logo_url}`} 
  alt="Logo" className="w-full h-full object-contain" />
                    ) : (
                      <Building2 className="w-8 h-8 text-gray-300" />
                    )}
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Company Logo</Label>
                    <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 2MB</p>
                    <label className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-[#F7F9FA] rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                      <Upload className="w-4 h-4" />
                      <span className="text-sm">Upload Logo</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label>Company Name *</Label>
                    <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required className="mt-1.5" />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Address</Label>
                    <Input value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="mt-1.5" />
                  </div>
                  <div>
                    <Label>City</Label>
                    <Input value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} className="mt-1.5" />
                  </div>
                  <div>
                    <Label>State</Label>
                    <Select value={formData.state_code} onValueChange={handleStateChange}>
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
                    <Input value={formData.pincode} onChange={(e) => setFormData({ ...formData, pincode: e.target.value })} maxLength={6} className="mt-1.5" />
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="mt-1.5" />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="mt-1.5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tax">
            <Card className="border-0 shadow-[0_6px_18px_rgba(15,23,36,0.06)]">
              <CardHeader>
                <CardTitle>Tax & GST Details</CardTitle>
                <CardDescription>Your GST registration and tax information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>GSTIN</Label>
                    <Input value={formData.gstin} onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })} maxLength={15} className="mt-1.5 font-mono" />
                  </div>
                  <div>
                    <Label>PAN</Label>
                    <Input value={formData.pan} onChange={(e) => setFormData({ ...formData, pan: e.target.value.toUpperCase() })} maxLength={10} className="mt-1.5 font-mono" />
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-xl border border-amber-100">
                  <Switch checked={formData.composition_scheme} onCheckedChange={(v) => setFormData({ ...formData, composition_scheme: v })} />
                  <div>
                    <Label className="cursor-pointer font-medium">Composition Scheme</Label>
                    <p className="text-xs text-gray-500">Enable if registered under GST composition scheme</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bank">
            <Card className="border-0 shadow-[0_6px_18px_rgba(15,23,36,0.06)]">
              <CardHeader>
                <CardTitle>Bank Account Details</CardTitle>
                <CardDescription>Bank information for invoice payments</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label>Bank Name</Label>
                    <Input value={formData.bank_name} onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })} className="mt-1.5" />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Branch</Label>
                    <Input value={formData.bank_branch} onChange={(e) => setFormData({ ...formData, bank_branch: e.target.value })} className="mt-1.5" />
                  </div>
                  <div>
                    <Label>Account Number</Label>
                    <Input value={formData.bank_account} onChange={(e) => setFormData({ ...formData, bank_account: e.target.value })} className="mt-1.5 font-mono" />
                  </div>
                  <div>
                    <Label>IFSC Code</Label>
                    <Input value={formData.bank_ifsc} onChange={(e) => setFormData({ ...formData, bank_ifsc: e.target.value.toUpperCase() })} className="mt-1.5 font-mono" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="invoice">
            <Card className="border-0 shadow-[0_6px_18px_rgba(15,23,36,0.06)]">
              <CardHeader>
                <CardTitle>Invoice Settings</CardTitle>
                <CardDescription>Configure invoice numbering and preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Invoice Prefix</Label>
                    <Input value={formData.invoice_prefix} onChange={(e) => setFormData({ ...formData, invoice_prefix: e.target.value.toUpperCase() })} className="mt-1.5" />
                  </div>
                  <div>
                    <Label>Next Invoice Number</Label>
                    <Input type="number" value={formData.invoice_counter} onChange={(e) => setFormData({ ...formData, invoice_counter: parseInt(e.target.value) || 1 })} min={1} className="mt-1.5" />
                  </div>
                  <div>
                    <Label>Financial Year Start</Label>
                    <Input type="date" value={formData.financial_year_start} onChange={(e) => setFormData({ ...formData, financial_year_start: e.target.value })} className="mt-1.5" />
                  </div>
                </div>

                <div className="p-4 bg-[#F7F9FA] rounded-xl">
                  <p className="text-sm font-medium text-[#0F1724]">Invoice Number Preview</p>
                  <p className="text-lg font-mono text-emerald-600 mt-1">
                    {formData.invoice_prefix}/{new Date().getFullYear().toString().slice(-2)}/{String(formData.invoice_counter).padStart(5, '0')}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end mt-6">
          <Button 
            type="submit" 
            className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 shadow-lg shadow-emerald-500/20"
            disabled={saveMutation.isPending}
          >
            <Save className="w-4 h-4 mr-2" />
            {saveMutation.isPending ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </form>
      {showSuccessModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
    
    <div className="bg-white rounded-2xl shadow-2xl px-10 py-8 flex flex-col items-center animate-[scaleIn_0.3s_ease]">
      
      {/* Icon */}
      <div className="w-16 h-16 flex items-center justify-center rounded-full bg-emerald-100 mb-4 animate-bounce">
        <CheckCircle className="w-10 h-10 text-emerald-600" />
      </div>

      {/* Text */}
      <h2 className="text-xl font-bold text-[#0F1724]">
        Saved Successfully!
      </h2>
      <p className="text-gray-500 mt-1 text-sm">
        Your company settings have been updated.
      </p>

    </div>
  </div>
)}
    </div>
  );
}