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
import StatsCard from '@/components/ui/StatsCard';
import {
  Plus,
  IndianRupee,
  CreditCard,
  Banknote,
  Smartphone,
  Search,
  Wallet,
  TrendingUp
} from 'lucide-react';
import { ExportButton } from '@/components/ui/ExportImportButtons';
import { format } from 'date-fns';

export default function Receipts() {
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    payment_type: 'receipt',
    payment_mode: 'cash',
    amount: 0,
    payment_date: format(new Date(), 'yyyy-MM-dd'),
    customer_id: '',
    customer_name: '',
    invoice_id: '',
    invoice_no: '',
    reference_no: '',
    bank_name: '',
    narration: ''
  });

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['payments', 'receipt'],
    queryFn: () => base44.entities.Payment.filter({ payment_type: 'receipt' }, '-payment_date'),
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: () => base44.entities.Customer.list(),
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ['invoices', 'unpaid'],
    queryFn: async () => {
      const allInvoices = await base44.entities.Invoice.filter({ invoice_type: 'sale' });
      return allInvoices.filter(inv => inv.payment_status !== 'paid');
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const payment = await base44.entities.Payment.create(data);
      
      // Update invoice if linked
      if (data.invoice_id) {
        const invoice = invoices.find(i => i.id === data.invoice_id);
        if (invoice) {
          const newAmountPaid = (invoice.amount_paid || 0) + data.amount;
          const newBalanceDue = invoice.grand_total - newAmountPaid;
          const newStatus = newBalanceDue <= 0 ? 'paid' : newAmountPaid > 0 ? 'partial' : 'unpaid';
          
          await base44.entities.Invoice.update(data.invoice_id, {
            amount_paid: newAmountPaid,
            balance_due: newBalanceDue,
            payment_status: newStatus
          });
        }
      }
      
      // Update customer balance
      if (data.customer_id) {
        const customer = customers.find(c => c.id === data.customer_id);
        if (customer) {
          await base44.entities.Customer.update(data.customer_id, {
            current_balance: (customer.current_balance || 0) - data.amount
          });
        }
      }
      
      return payment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      resetForm();
    },
  });

  const resetForm = () => {
    setFormData({
      payment_type: 'receipt',
      payment_mode: 'cash',
      amount: 0,
      payment_date: format(new Date(), 'yyyy-MM-dd'),
      customer_id: '',
      customer_name: '',
      invoice_id: '',
      invoice_no: '',
      reference_no: '',
      bank_name: '',
      narration: ''
    });
    setShowForm(false);
  };

  const handleCustomerSelect = (customerId) => {
    const customer = customers.find(c => c.id === customerId);
    setFormData({
      ...formData,
      customer_id: customerId,
      customer_name: customer?.name || ''
    });
  };

  const handleInvoiceSelect = (invoiceId) => {
    const invoice = invoices.find(i => i.id === invoiceId);
    if (invoice) {
      setFormData({
        ...formData,
        invoice_id: invoiceId,
        invoice_no: invoice.invoice_no,
        customer_id: invoice.customer_id,
        customer_name: invoice.customer_name,
        amount: invoice.balance_due || invoice.grand_total
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  // Calculate stats
  const totalReceipts = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const todayReceipts = payments
    .filter(p => p.payment_date === format(new Date(), 'yyyy-MM-dd'))
    .reduce((sum, p) => sum + (p.amount || 0), 0);
  const cashReceipts = payments
    .filter(p => p.payment_mode === 'cash')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const paymentModeIcons = {
    cash: Banknote,
    bank: Wallet,
    card: CreditCard,
    upi: Smartphone,
    cheque: Wallet
  };

  const columns = [
    {
      header: 'Date',
      render: (row) => (
        <p className="font-medium">{format(new Date(row.payment_date), 'dd MMM yyyy')}</p>
      )
    },
    {
      header: 'Customer',
      render: (row) => (
        <div>
          <p className="font-medium text-[#0F1724]">{row.customer_name || 'N/A'}</p>
          {row.invoice_no && (
            <p className="text-xs text-gray-400">Invoice: {row.invoice_no}</p>
          )}
        </div>
      )
    },
    {
      header: 'Mode',
      render: (row) => {
        const Icon = paymentModeIcons[row.payment_mode] || Wallet;
        return (
          <Badge variant="secondary" className="bg-gray-100 text-gray-700 capitalize">
            <Icon className="w-3 h-3 mr-1" />
            {row.payment_mode}
          </Badge>
        );
      }
    },
    {
      header: 'Reference',
      render: (row) => row.reference_no || '-'
    },
    {
      header: 'Amount',
      render: (row) => (
        <p className="font-semibold text-emerald-600">{formatCurrency(row.amount)}</p>
      ),
      className: 'text-right'
    },
    {
      header: 'Status',
      render: (row) => (
        <Badge variant="secondary" className={
          row.status === 'completed' 
            ? 'bg-emerald-100 text-emerald-700' 
            : row.status === 'pending'
            ? 'bg-amber-100 text-amber-700'
            : 'bg-gray-100 text-gray-700'
        }>
          {row.status || 'completed'}
        </Badge>
      )
    }
  ];

  const filteredPayments = payments.filter(p =>
    !searchQuery ||
    p.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.invoice_no?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#0F1724]">Payment Receipts</h1>
          <p className="text-gray-500 mt-1">Record payments received from customers</p>
        </div>
        <div className="flex gap-3">
          <ExportButton
            data={payments}
            filename="receipts"
            columns={[
              { header: 'Date', accessor: 'payment_date' },
              { header: 'Customer', accessor: 'customer_name' },
              { header: 'Invoice', accessor: 'invoice_no' },
              { header: 'Mode', accessor: 'payment_mode' },
              { header: 'Reference', accessor: 'reference_no' },
              { header: 'Amount', accessor: 'amount' },
              { header: 'Status', accessor: 'status' }
            ]}
          />
          <Button 
            className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-lg shadow-emerald-500/20"
            onClick={() => setShowForm(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            New Receipt
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard
          title="Today's Receipts"
          value={formatCurrency(todayReceipts)}
          icon={IndianRupee}
          gradient="from-emerald-500 to-green-600"
        />
        <StatsCard
          title="Total Received"
          value={formatCurrency(totalReceipts)}
          icon={TrendingUp}
          gradient="from-blue-500 to-indigo-600"
        />
        <StatsCard
          title="Cash Received"
          value={formatCurrency(cashReceipts)}
          icon={Banknote}
          gradient="from-purple-500 to-pink-600"
        />
      </div>

      {/* Search */}
      <Card className="border-0 shadow-[0_6px_18px_rgba(15,23,36,0.06)]">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search receipts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-[#F7F9FA] border-0"
            />
          </div>
        </CardContent>
      </Card>

      {/* Receipts Table */}
      <Card className="border-0 shadow-[0_6px_18px_rgba(15,23,36,0.06)]">
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={filteredPayments}
            isLoading={isLoading}
            searchable={false}
            emptyMessage="No receipts found"
          />
        </CardContent>
      </Card>

      {/* New Receipt Dialog */}
      <Dialog open={showForm} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <IndianRupee className="w-5 h-5" />
              Record Payment Receipt
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Payment Date</Label>
              <Input
                type="date"
                value={formData.payment_date}
                onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                className="mt-1.5"
                required
              />
            </div>

            <div>
              <Label>Select Invoice (Optional)</Label>
              <Select value={formData.invoice_id} onValueChange={handleInvoiceSelect}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Select unpaid invoice" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>No Invoice</SelectItem>
                  {invoices.map(inv => (
                    <SelectItem key={inv.id} value={inv.id}>
                      {inv.invoice_no} - {inv.customer_name} ({formatCurrency(inv.balance_due || inv.grand_total)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

            <div>
              <Label>Payment Mode</Label>
              <Select 
                value={formData.payment_mode} 
                onValueChange={(v) => setFormData({ ...formData, payment_mode: v })}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank">Bank Transfer</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Amount *</Label>
              <Input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                min="0"
                step="0.01"
                required
                className="mt-1.5 text-lg font-semibold"
              />
            </div>

            {['bank', 'card', 'upi', 'cheque'].includes(formData.payment_mode) && (
              <div>
                <Label>Reference / Transaction No.</Label>
                <Input
                  value={formData.reference_no}
                  onChange={(e) => setFormData({ ...formData, reference_no: e.target.value })}
                  placeholder="Transaction reference"
                  className="mt-1.5"
                />
              </div>
            )}

            <div>
              <Label>Narration</Label>
              <Input
                value={formData.narration}
                onChange={(e) => setFormData({ ...formData, narration: e.target.value })}
                placeholder="Optional notes"
                className="mt-1.5"
              />
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-gradient-to-r from-emerald-500 to-green-600"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? 'Saving...' : 'Save Receipt'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}