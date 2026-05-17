import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
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
import InvoiceLineItem from '@/components/invoice/InvoiceLineItem';
import InvoiceSummary from '@/components/invoice/InvoiceSummary';
import {
  Plus,
  FileText,
  Search,
  Download,
  Eye,
  ArrowRight,
  Trash2
} from 'lucide-react';
import { format, addDays } from 'date-fns';

export default function Quotations() {
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
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
    invoice_no: '',
    invoice_type: 'proforma',
    invoice_date: format(new Date(), 'yyyy-MM-dd'),
    due_date: format(addDays(new Date(), 15), 'yyyy-MM-dd'),
    customer_id: '',
    customer_name: '',
    customer_gstin: '',
    customer_address: '',
    is_igst: false,
    items: [{ ...emptyLineItem }],
    notes: '',
    terms: 'This quotation is valid for 15 days from the date of issue.'
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

  const { data: quotations = [], isLoading } = useQuery({
    queryKey: ['invoices', 'proforma'],
    queryFn: () => base44.entities.Invoice.filter({ invoice_type: 'proforma' }, '-created_date'),
  });

  const { data: items = [] } = useQuery({
    queryKey: ['items'],
    queryFn: () => base44.entities.Item.filter({ is_active: true }),
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: () => base44.entities.Customer.list(),
  });

  const { data: company } = useQuery({
    queryKey: ['company'],
    queryFn: async () => {
      const companies = await base44.entities.Company.list();
      return companies[0];
    },
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Invoice.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Invoice.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });

  // Calculate totals when items change
  React.useEffect(() => {
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

  // Generate quote number
  React.useEffect(() => {
    if (company) {
      const year = format(new Date(), 'yy');
      const counter = Math.floor(Math.random() * 10000);
      setFormData(prev => ({
        ...prev,
        invoice_no: `QT/${year}/${String(counter).padStart(5, '0')}`
      }));
    }
  }, [company, showForm]);

  const resetForm = () => {
    setFormData({
      invoice_no: '',
      invoice_type: 'proforma',
      invoice_date: format(new Date(), 'yyyy-MM-dd'),
      due_date: format(addDays(new Date(), 15), 'yyyy-MM-dd'),
      customer_id: '',
      customer_name: '',
      customer_gstin: '',
      customer_address: '',
      is_igst: false,
      items: [{ ...emptyLineItem }],
      notes: '',
      terms: 'This quotation is valid for 15 days from the date of issue.'
    });
    setShowForm(false);
  };

  const handleCustomerSelect = (customerId) => {
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      setFormData(prev => ({
        ...prev,
        customer_id: customerId,
        customer_name: customer.name,
        customer_gstin: customer.gstin || '',
        customer_address: `${customer.address || ''}, ${customer.city || ''}, ${customer.state || ''}`
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
    createMutation.mutate({
      ...formData,
      ...totals,
      status: 'draft',
      company_id: company?.id
    });
  };

  const handleDelete = (quotation) => {
    if (confirm('Are you sure you want to delete this quotation?')) {
      deleteMutation.mutate(quotation.id);
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
      header: 'Quotation',
      render: (row) => (
        <div>
          <p className="font-medium text-[#0F1724]">{row.invoice_no}</p>
          <p className="text-xs text-gray-400">{format(new Date(row.invoice_date), 'dd MMM yyyy')}</p>
        </div>
      )
    },
    {
      header: 'Customer',
      accessor: 'customer_name'
    },
    {
      header: 'Valid Until',
      render: (row) => row.due_date ? format(new Date(row.due_date), 'dd MMM yyyy') : '-'
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
      render: (row) => (
        <Badge variant="secondary" className="bg-blue-100 text-blue-700">
          {row.status || 'draft'}
        </Badge>
      )
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center justify-end gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-emerald-600">
            <Eye className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-blue-600" title="Convert to Invoice">
            <ArrowRight className="w-4 h-4" />
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

  const filteredQuotations = quotations.filter(q =>
    !searchQuery ||
    q.invoice_no?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    q.customer_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#0F1724]">Quotations / Proforma</h1>
          <p className="text-gray-500 mt-1">Create and manage quotations for your customers</p>
        </div>
        <Button 
          className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-lg shadow-emerald-500/20"
          onClick={() => setShowForm(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          New Quotation
        </Button>
      </div>

      <Card className="border-0 shadow-[0_6px_18px_rgba(15,23,36,0.06)]">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search quotations..."
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
            data={filteredQuotations}
            isLoading={isLoading}
            searchable={false}
            emptyMessage="No quotations found"
          />
        </CardContent>
      </Card>

      <Dialog open={showForm} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Create Quotation
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label>Quotation No.</Label>
                <Input
                  value={formData.invoice_no}
                  onChange={(e) => setFormData({ ...formData, invoice_no: e.target.value })}
                  className="mt-1.5 font-mono"
                  required
                />
              </div>
              <div>
                <Label>Date</Label>
                <Input
                  type="date"
                  value={formData.invoice_date}
                  onChange={(e) => setFormData({ ...formData, invoice_date: e.target.value })}
                  className="mt-1.5"
                  required
                />
              </div>
              <div>
                <Label>Valid Until</Label>
                <Input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>Customer</Label>
                <Select value={formData.customer_id} onValueChange={handleCustomerSelect}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Line Items */}
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
              <div className="space-y-4">
                <div>
                  <Label>Notes</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Additional notes..."
                    className="mt-1.5"
                    rows={3}
                  />
                </div>
                <div>
                  <Label>Terms & Conditions</Label>
                  <Textarea
                    value={formData.terms}
                    onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                    className="mt-1.5"
                    rows={3}
                  />
                </div>
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
                {createMutation.isPending ? 'Saving...' : 'Create Quotation'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}