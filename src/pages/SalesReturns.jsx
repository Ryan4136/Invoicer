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
import DataTable from '@/components/ui/DataTable';
import {
  Plus,
  FileText,
  Search,
  RotateCcw
} from 'lucide-react';
import { ExportButton } from '@/components/ui/ExportImportButtons';
import { format } from 'date-fns';

export default function SalesReturns() {
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    invoice_no: '',
    invoice_type: 'credit_note',
    invoice_date: format(new Date(), 'yyyy-MM-dd'),
    customer_name: '',
    original_invoice_no: '',
    reason: '',
    items: [],
    grand_total: 0
  });

const { data: returns = [], isLoading } = useQuery({
  queryKey: ['sales_returns'],
  queryFn: async () => {
    const res = await fetch('/api/sales_return/list.php');
    return res.json();
  }
});

  const { data: salesInvoices = [] } = useQuery({
    queryKey: ['invoices', 'sale'],
    queryFn: () => base44.entities.Invoice.filter({ invoice_type: 'sale' }, '-invoice_date'),
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
  const res = await fetch('/api/sales_return/create.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });

  return res.json();
}
  });

  const resetForm = () => {
    setFormData({
      invoice_no: '',
      invoice_type: 'credit_note',
      invoice_date: format(new Date(), 'yyyy-MM-dd'),
      customer_name: '',
      original_invoice_no: '',
      reason: '',
      items: [],
      grand_total: 0
    });
    setShowForm(false);
  };

  const handleOriginalInvoiceSelect = (invoiceId) => {
    const invoice = salesInvoices.find(i => i.id === invoiceId);
    if (invoice) {
      const prefix = company?.invoice_prefix || 'CN';
      const counter = (company?.invoice_counter || 1);
      const year = format(new Date(), 'yy');
      
      setFormData({
        ...formData,
        invoice_no: `${prefix}-CN/${year}/${String(counter).padStart(5, '0')}`,
        original_invoice_no: invoice.invoice_no,
        customer_name: invoice.customer_name,
        customer_id: invoice.customer_id,
        customer_gstin: invoice.customer_gstin,
        items: (invoice.items || []).map(item => ({
  ...item,
  return_qty: 0,
  max_qty: item.quantity,
  already_returned: 0 // will update later from API
})),
grand_total: 0,
        subtotal: invoice.subtotal,
        taxable_amount: invoice.taxable_amount,
        cgst_total: invoice.cgst_total,
        sgst_total: invoice.sgst_total,
        igst_total: invoice.igst_total
      });
    }
  };

const handleSubmit = (e) => {
  e.preventDefault();

  const filteredItems = formData.items.filter(i => i.return_qty > 0);

  if (filteredItems.length === 0) {
    alert("Enter return quantity");
    return;
  }

  createMutation.mutate({
    ...formData,
    items: filteredItems,
    status: 'confirmed',
    company_id: company?.id
  });
};
  const updateReturnQty = (index, value) => {
  const updatedItems = [...formData.items];
  const item = updatedItems[index];

  let qty = parseFloat(value) || 0;

  // Prevent over-return
  const allowedQty = item.max_qty - (item.already_returned || 0);

  if (qty > allowedQty) {
    qty = allowedQty;
  }

  item.return_qty = qty;

  // Recalculate total
  const newTotal = updatedItems.reduce((sum, i) => {
    return sum + (i.return_qty * i.rate);
  }, 0);

  setFormData({
    ...formData,
    items: updatedItems,
    grand_total: newTotal
  });
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
      header: 'Credit Note',
      render: (row) => (
        <div>
          <p className="font-medium text-[#0F1724]">{row.invoice_no}</p>
          <p className="text-xs text-gray-400">{format(new Date(row.invoice_date), 'dd MMM yyyy')}</p>
        </div>
      )
    },
    {
      header: 'Original Invoice',
      render: (row) => row.original_invoice_no || '-'
    },
    {
      header: 'Customer',
      accessor: 'customer_name'
    },
    {
      header: 'Amount',
      render: (row) => (
        <p className="font-semibold text-red-600">{formatCurrency(row.grand_total)}</p>
      ),
      className: 'text-right'
    },
    {
      header: 'Status',
      render: (row) => (
        <Badge variant="secondary" className="bg-purple-100 text-purple-700">
          {row.status || 'confirmed'}
        </Badge>
      )
    }
  ];

  const filteredReturns = returns.filter(r =>
    !searchQuery ||
    r.invoice_no?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.customer_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#0F1724]">Sales Returns / Credit Notes</h1>
          <p className="text-gray-500 mt-1">Manage sales returns and issue credit notes</p>
        </div>
        <div className="flex gap-3">
          <ExportButton
            data={returns}
            filename="sales_returns"
            columns={[
              { header: 'Credit Note No', accessor: 'invoice_no' },
              { header: 'Date', accessor: 'invoice_date' },
              { header: 'Original Invoice', accessor: 'original_invoice_no' },
              { header: 'Customer', accessor: 'customer_name' },
              { header: 'Amount', accessor: 'grand_total' },
              { header: 'Status', accessor: 'status' }
            ]}
          />
          <Button 
            className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-lg shadow-emerald-500/20"
            onClick={() => setShowForm(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            New Credit Note
          </Button>
        </div>
      </div>

      <Card className="border-0 shadow-[0_6px_18px_rgba(15,23,36,0.06)]">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search credit notes..."
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
            data={filteredReturns}
            isLoading={isLoading}
            searchable={false}
            emptyMessage="No credit notes found"
          />
        </CardContent>
      </Card>

      <Dialog open={showForm} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <RotateCcw className="w-5 h-5" />
              Create Credit Note
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Select Original Invoice *</Label>
              <Select onValueChange={handleOriginalInvoiceSelect}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Select invoice to return" />
                </SelectTrigger>
                <SelectContent>
                  {salesInvoices.map(inv => (
                    <SelectItem key={inv.id} value={inv.id}>
                      {inv.invoice_no} - {inv.customer_name} ({formatCurrency(inv.grand_total)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Credit Note No.</Label>
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
              <Label>Customer</Label>
              <Input
                value={formData.customer_name}
                readOnly
                className="mt-1.5 bg-gray-50"
              />
            </div>

            <div>
              <Label>Reason for Return</Label>
              <Input
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                placeholder="e.g., Defective product, Wrong item delivered"
                className="mt-1.5"
              />
            </div>

<div className="space-y-2 max-h-60 overflow-auto">
  {formData.items.map((item, index) => (
    <div key={index} className="flex justify-between items-center border p-2 rounded">
      
      <div className="flex-1">
        <p className="text-sm font-medium">{item.product_name}</p>
        <p className="text-xs text-gray-500">
          Sold: {item.quantity} | Returned: {item.already_returned || 0}
        </p>
      </div>

      <div className="w-24">
        <Input
          type="number"
          min="0"
          value={item.return_qty || ''}
          onChange={(e) => updateReturnQty(index, e.target.value)}
          placeholder="Qty"
        />
      </div>

      <div className="w-24 text-right text-sm">
        ₹{(item.return_qty * item.rate || 0).toFixed(2)}
      </div>

    </div>
  ))}
</div>
            <div className="p-4 bg-red-50 rounded-xl border border-red-100">
              <p className="text-sm text-gray-600">Credit Note Amount</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(formData.grand_total)}</p>
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-gradient-to-r from-emerald-500 to-green-600"
                disabled={createMutation.isPending || !formData.original_invoice_no}
              >
                {createMutation.isPending ? 'Creating...' : 'Create Credit Note'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}