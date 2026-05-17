import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import InvoiceLineItem from '@/components/invoice/InvoiceLineItem';
import InvoiceSummary from '@/components/invoice/InvoiceSummary';
import DataTable from '@/components/ui/DataTable';
import {
  Plus,
  FileText,
  Search,
  Package,
  Trash2,
  Eye,
  Printer
} from 'lucide-react';
import { ExportButton } from '@/components/ui/ExportImportButtons';
import InvoicePrintView from '@/components/invoice/InvoicePrintView';
import { format } from 'date-fns';

export default function PurchaseInvoice() {
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewingInvoice, setViewingInvoice] = useState(null);
  const queryClient = useQueryClient();

  const emptyLineItem = {
    item_id: '',
    item_name: '',
    item_code: '',
    hsn_code: '',
    quantity: 1,
    unit: 'PCS',
    rate: 0,
    discount_percent: 0,
    discount_amount: 0,
    taxable_amount: 0,
    gst_rate: 18,
    cgst_amount: 0,
    sgst_amount: 0,
    igst_amount: 0,
    total_amount: 0
  };

  const [formData, setFormData] = useState({
    purchase_id: '',
    invoice_type: 'purchase',
    invoice_date: format(new Date(), 'yyyy-MM-dd'),
    due_date: '',
    customer_id: '',
    customer_name: '',
    customer_gstin: '',
    customer_address: '',
    is_igst: false,
    reverse_charge: false,
    items: [{ ...emptyLineItem }],
    notes: ''
  });

  const [totals, setTotals] = useState({
    subtotal: 0,
    total_discount: 0,
    taxable_amount: 0,
    cgst_total: 0,
    sgst_total: 0,
    igst_total: 0,
    round_off: 0,
    grand_total: 0
  });

const { data: purchases = [], isLoading } = useQuery({
  queryKey: ['purchases'],
  queryFn: async () => {
    const res = await fetch('http://localhost:8000/api/purchases/list.php', {
      credentials: 'include'
    });
    const json = await res.json();
    return json.data || [];
  }
});

const { data: items = [] } = useQuery({
  queryKey: ['items'],
  queryFn: async () => {
    const res = await fetch('http://localhost:8000/api/products/list.php', {
      credentials: 'include'
    });
    const json = await res.json();

    return (Array.isArray(json) ? json : []).map(p => ({
      id: Number(p.id),
      name: p.name,
      sale_price: Number(p.sale_price || 0),
      current_stock: Number(p.current_stock || 0),
      hsn_code: p.hsn_code || '',
      unit: p.unit || 'PCS'
    }));
  }
});

 const { data: suppliers = [] } = useQuery({
  queryKey: ['suppliers'],
  queryFn: async () => {
    const res = await fetch('http://localhost:8000/api/customers/list.php', {
      credentials: 'include'
    });
    const json = await res.json();

    return (json || []).filter(
      c => c.type === 'supplier' || c.type === 'both'
    );
  }
});

  const { data: company } = useQuery({
    queryKey: ['company'],
    queryFn: async () => {
      const companies = await base44.entities.Company.list();
      return companies[0];
    },
  });

const createMutation = useMutation({
  mutationFn: async (data) => {
    const res = await fetch('http://localhost:8000/api/purchases/create.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(data)
    });

    const json = await res.json();

    if (!json.success) {
      throw new Error(json.error || 'Failed to create purchase');
    }

    return json;
  },

  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['purchases'] });
    queryClient.invalidateQueries({ queryKey: ['items'] });
    resetForm();
  }
});

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Invoice.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });

  // Calculate totals
  useEffect(() => {
    let subtotal = 0;
    let totalDiscount = 0;
    let taxableAmount = 0;
    let cgstTotal = 0;
    let sgstTotal = 0;
    let igstTotal = 0;

    formData.items.forEach(item => {
      subtotal += (item.quantity || 0) * (item.rate || 0);
      totalDiscount += item.discount_amount || 0;
      taxableAmount += item.taxable_amount || 0;
      
      if (formData.is_igst) {
        igstTotal += item.igst_amount || 0;
      } else {
        cgstTotal += item.cgst_amount || 0;
        sgstTotal += item.sgst_amount || 0;
      }
    });

    const grandTotal = taxableAmount + cgstTotal + sgstTotal + igstTotal;
    const roundOff = Math.round(grandTotal) - grandTotal;

    setTotals({
      subtotal,
      total_discount: totalDiscount,
      taxable_amount: taxableAmount,
      cgst_total: cgstTotal,
      sgst_total: sgstTotal,
      igst_total: igstTotal,
      round_off: roundOff,
      grand_total: Math.round(grandTotal)
    });
  }, [formData.items, formData.is_igst]);

  const resetForm = () => {
    setFormData({
      purchase_id: '',
      invoice_type: 'purchase',
      invoice_date: format(new Date(), 'yyyy-MM-dd'),
      due_date: '',
      customer_id: '',
      customer_name: '',
      customer_gstin: '',
      customer_address: '',
      is_igst: false,
      reverse_charge: false,
      items: [{ ...emptyLineItem }],
      notes: ''
    });
    setShowForm(false);
  };

  const handleSupplierSelect = (supplierId) => {
    const supplier = suppliers.find(s => s.id === supplierId);
    if (supplier) {
      const companyState = company?.state_code || '';
      const isInterState = supplier.state_code && supplier.state_code !== companyState;
      
      setFormData(prev => ({
        ...prev,
        customer_id: supplier.id,
        customer_name: supplier.name,
        customer_gstin: supplier.gstin || '',
        customer_address: `${supplier.address || ''}, ${supplier.city || ''}, ${supplier.state || ''}`,
        customer_state: supplier.state || '',
        customer_state_code: supplier.state_code || '',
        is_igst: isInterState
      }));
    }
  };

  const handleLineItemUpdate = (index, updatedItem) => {
    const newItems = [...formData.items];
    newItems[index] = updatedItem;
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const addLineItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { ...emptyLineItem }]
    }));
  };

  const removeLineItem = (index) => {
    if (formData.items.length > 1) {
      setFormData(prev => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index)
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.customer_id) {
  alert("Select supplier");
  return;
}
createMutation.mutate({
  purchase_id: formData.purchase_id,
  invoice_date: formData.invoice_date,
  supplier_id: Number(formData.customer_id),
  supplier_name: formData.customer_name,
  gstin: formData.customer_gstin || '',
  subtotal: totals.subtotal,
  tax_amount: totals.cgst_total + totals.sgst_total + totals.igst_total,
  total_amount: totals.grand_total,
  notes: formData.notes,

  items: formData.items.map(i => ({
    product_id: Number(i.item_id),
    product_name: i.item_name,
    quantity: Number(i.quantity),
    rate: Number(i.rate),
    total: Number(i.total_amount)
  }))
});
  };

  const handleDelete = (invoice) => {
    if (confirm('Are you sure you want to delete this purchase?')) {
      deleteMutation.mutate(invoice.id);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const columns = [
    {
      header: 'Invoice',
      render: (row) => (
        <div>
          <p className="font-medium text-[#0F1724]">PUR-{row.purchase_id}</p>
          <p className="text-xs text-gray-400">{format(new Date(row.purchase_date), 'dd MMM yyyy')}</p>
        </div>
      )
    },
    {
  header: 'Supplier',
  render: (row) => (
    <div>
      <p className="font-medium">
        {row.supplier_name || '-'}
      </p>
      {row.supplier_gst && (
        <p className="text-xs text-gray-400 font-mono">
          {row.supplier_gst}
        </p>
      )}
    </div>
  )
},
    {
      header: 'Amount',
      render: (row) => (
        <p className="font-semibold text-[#0F1724]">{formatCurrency(row.grand_total)}</p>
      ),
      className: 'text-right'
    },
{
  header: 'Status',
  render: (row) => {
    let status = 'unpaid';

    if (Number(row.due) === 0) {
      status = 'paid';
    } else if (Number(row.paid) > 0) {
      status = 'partial';
    }

    return (
      <Badge className={`text-xs ${
        status === 'paid'
          ? 'bg-emerald-100 text-emerald-700'
          : status === 'partial'
          ? 'bg-amber-100 text-amber-700'
          : 'bg-red-100 text-red-700'
      }`}>
        {status}
      </Badge>
    );
  }
},
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center justify-end gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-gray-400 hover:text-emerald-600"
            onClick={(e) => { e.stopPropagation(); setViewingInvoice(row); }}
          >
            <Eye className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-gray-400 hover:text-blue-600"
            onClick={(e) => { e.stopPropagation(); setViewingInvoice(row); }}
          >
            <Printer className="w-4 h-4" />
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

const filteredPurchases = purchases.filter(p =>
  !searchQuery ||
  String(p.purchase_id).includes(searchQuery) ||
  p.supplier_name?.toLowerCase().includes(searchQuery.toLowerCase())
);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#0F1724]">Purchase Invoices</h1>
          <p className="text-gray-500 mt-1">Record purchases from your suppliers</p>
        </div>
        <div className="flex gap-3">
          <ExportButton
            data={purchases}
            filename="purchase_invoices"
            columns={[
              { header: 'Invoice No', accessor: 'purchase_id' },
              { header: 'Date', accessor: 'invoice_date' },
              { header: 'Supplier', accessor: 'supplier_name' },
              { header: 'GSTIN', accessor: 'supplier_gst' },
              { header: 'Taxable Amount', accessor: 'taxable_amount' },
              { header: 'CGST', accessor: 'cgst_total' },
              { header: 'SGST', accessor: 'sgst_total' },
              { header: 'IGST', accessor: 'igst_total' },
              { header: 'Grand Total', accessor: 'grand_total' },
              { header: 'Payment Status', accessor: 'payment_status' }
            ]}
          />
          <Button 
            className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-lg shadow-emerald-500/20"
            onClick={() => setShowForm(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            New Purchase
          </Button>
        </div>
      </div>

      <Card className="border-0 shadow-[0_6px_18px_rgba(15,23,36,0.06)]">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search purchases..."
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
            data={filteredPurchases}
            isLoading={isLoading}
            searchable={false}
            emptyMessage="No purchase invoices found"
          />
        </CardContent>
      </Card>

      {/* Invoice Print View */}
      {viewingInvoice && (
        <InvoicePrintView 
          invoice={viewingInvoice} 
          company={company} 
          onClose={() => setViewingInvoice(null)} 
        />
      )}

      <Dialog open={showForm} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Package className="w-5 h-5" />
              New Purchase Invoice
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label>Invoice No. *</Label>
                <Input
                  value={formData.purchase_id}
                  onChange={(e) => setFormData({ ...formData, purchase_id: e.target.value })}
                  placeholder="Supplier invoice no."
                  className="mt-1.5 font-mono"
                  required
                />
              </div>
              <div>
                <Label>Invoice Date</Label>
                <Input
                  type="date"
                  value={formData.invoice_date}
                  onChange={(e) => setFormData({ ...formData, invoice_date: e.target.value })}
                  className="mt-1.5"
                  required
                />
              </div>
              <div>
                <Label>Due Date</Label>
                <Input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>Supplier *</Label>
                <Select value={formData.customer_id} onValueChange={handleSupplierSelect}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Select supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map(s => (
                      <SelectItem key={s.id} value={String(s.id)}>
  {s.name}
</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_igst}
                  onCheckedChange={(v) => setFormData({ ...formData, is_igst: v })}
                />
                <Label className="cursor-pointer">Inter-State (IGST)</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.reverse_charge}
                  onCheckedChange={(v) => setFormData({ ...formData, reverse_charge: v })}
                />
                <Label className="cursor-pointer">Reverse Charge</Label>
              </div>
            </div>

            <Card className="border border-gray-100">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-gray-50 rounded-lg mb-2 text-xs font-medium text-gray-500">
                  <div className="col-span-3">Item</div>
                  <div className="col-span-1">HSN</div>
                  <div className="col-span-1">Qty</div>
                  <div className="col-span-1">Unit</div>
                  <div className="col-span-1">Rate</div>
                  <div className="col-span-1">Disc%</div>
                  <div className="col-span-1">GST%</div>
                  <div className="col-span-2 text-right">Amount</div>
                  <div className="col-span-1"></div>
                </div>
                
                {formData.items.map((item, index) => (
                  <InvoiceLineItem
                    key={index}
                    item={item}
                    index={index}
                    onUpdate={handleLineItemUpdate}
                    onRemove={removeLineItem}
                    isIGST={formData.is_igst}
                    items={items}
                  />
                ))}
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={addLineItem}
                  className="mt-2 border-dashed border-gray-300"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Item
                </Button>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label>Notes</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes..."
                  className="mt-1.5"
                  rows={4}
                />
              </div>
              <InvoiceSummary invoice={totals} isIGST={formData.is_igst} />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-gradient-to-r from-emerald-500 to-green-600"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? 'Saving...' : 'Save Purchase'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}   