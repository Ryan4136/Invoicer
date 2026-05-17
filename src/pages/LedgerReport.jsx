import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import StatsCard from '@/components/ui/StatsCard';
import DataTable from '@/components/ui/DataTable';
import {
  Users,
  IndianRupee,
  TrendingUp,
  TrendingDown,
  Search
} from 'lucide-react';
import { ExportButton } from '@/components/ui/ExportImportButtons';
import { format, parseISO } from 'date-fns';

export default function LedgerReport() {
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [filterType, setFilterType] = useState('all');

  const { data: customers = [], isLoading: loadingCustomers } = useQuery({
    queryKey: ['customers'],
    queryFn: () => base44.entities.Customer.list(),
  });

  const { data: invoices = [], isLoading: loadingInvoices } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => base44.entities.Invoice.list('-invoice_date'),
  });

  const { data: payments = [], isLoading: loadingPayments } = useQuery({
    queryKey: ['payments'],
    queryFn: () => base44.entities.Payment.list('-payment_date'),
  });

  // Filter customers by type
  const filteredCustomers = useMemo(() => {
    if (filterType === 'all') return customers;
    return customers.filter(c => c.type === filterType);
  }, [customers, filterType]);

  // Generate ledger entries for selected customer
  const ledgerEntries = useMemo(() => {
    if (!selectedCustomer) return [];

    const entries = [];
    let runningBalance = 0;

    // Get customer's opening balance
    const customer = customers.find(c => c.id === selectedCustomer);
    if (customer?.opening_balance) {
      runningBalance = customer.opening_balance;
      entries.push({
        id: 'opening',
        date: customer.created_date || new Date().toISOString(),
        type: 'Opening Balance',
        reference: '-',
        debit: customer.opening_balance > 0 ? customer.opening_balance : 0,
        credit: customer.opening_balance < 0 ? Math.abs(customer.opening_balance) : 0,
        balance: runningBalance
      });
    }

    // Add sales invoices (debits for customer)
    invoices
      .filter(inv => inv.customer_id === selectedCustomer && inv.invoice_type === 'sale')
      .forEach(inv => {
        runningBalance += inv.grand_total || 0;
        entries.push({
          id: `inv-${inv.id}`,
          date: inv.invoice_date || inv.created_date,
          type: 'Sales Invoice',
          reference: inv.invoice_no,
          debit: inv.grand_total || 0,
          credit: 0,
          balance: runningBalance
        });
      });

    // Add purchase invoices (credits for supplier)
    invoices
      .filter(inv => inv.customer_id === selectedCustomer && inv.invoice_type === 'purchase')
      .forEach(inv => {
        runningBalance -= inv.grand_total || 0;
        entries.push({
          id: `pinv-${inv.id}`,
          date: inv.invoice_date || inv.created_date,
          type: 'Purchase Invoice',
          reference: inv.invoice_no,
          debit: 0,
          credit: inv.grand_total || 0,
          balance: runningBalance
        });
      });

    // Add receipts (credits)
    payments
      .filter(p => p.customer_id === selectedCustomer && p.payment_type === 'receipt')
      .forEach(p => {
        runningBalance -= p.amount || 0;
        entries.push({
          id: `rcpt-${p.id}`,
          date: p.payment_date || p.created_date,
          type: 'Receipt',
          reference: p.reference_no || '-',
          debit: 0,
          credit: p.amount || 0,
          balance: runningBalance
        });
      });

    // Add payments (debits for supplier)
    payments
      .filter(p => p.customer_id === selectedCustomer && p.payment_type === 'payment')
      .forEach(p => {
        runningBalance += p.amount || 0;
        entries.push({
          id: `pymt-${p.id}`,
          date: p.payment_date || p.created_date,
          type: 'Payment',
          reference: p.reference_no || '-',
          debit: p.amount || 0,
          credit: 0,
          balance: runningBalance
        });
      });

    // Sort by date
    entries.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Recalculate running balance after sorting
    let balance = 0;
    entries.forEach(entry => {
      if (entry.type === 'Opening Balance') {
        balance = entry.debit - entry.credit;
      } else {
        balance += entry.debit - entry.credit;
      }
      entry.balance = balance;
    });

    return entries;
  }, [selectedCustomer, invoices, payments, customers]);

  // Calculate summary
  const summary = useMemo(() => {
    const totalReceivable = customers
      .filter(c => c.type === 'customer' || c.type === 'both')
      .reduce((sum, c) => sum + Math.max(0, c.current_balance || 0), 0);

    const totalPayable = customers
      .filter(c => c.type === 'supplier' || c.type === 'both')
      .reduce((sum, c) => sum + Math.max(0, -(c.current_balance || 0)), 0);

    return { totalReceivable, totalPayable };
  }, [customers]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const customerColumns = [
    {
      header: 'Party Name',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            row.type === 'supplier' 
              ? 'bg-purple-100' 
              : row.type === 'both'
              ? 'bg-amber-100'
              : 'bg-emerald-100'
          }`}>
            <Users className={`w-5 h-5 ${
              row.type === 'supplier' 
                ? 'text-purple-600' 
                : row.type === 'both'
                ? 'text-amber-600'
                : 'text-emerald-600'
            }`} />
          </div>
          <div>
            <p className="font-medium text-[#0F1724]">{row.name}</p>
            <p className="text-xs text-gray-400">{row.phone}</p>
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
      header: 'Balance',
      render: (row) => (
        <p className={`font-semibold ${
          (row.current_balance || 0) > 0 
            ? 'text-red-500' 
            : (row.current_balance || 0) < 0 
            ? 'text-emerald-500' 
            : 'text-gray-500'
        }`}>
          {formatCurrency(Math.abs(row.current_balance || 0))}
          {(row.current_balance || 0) > 0 && <span className="text-xs ml-1">Dr</span>}
          {(row.current_balance || 0) < 0 && <span className="text-xs ml-1">Cr</span>}
        </p>
      ),
      className: 'text-right'
    },
    {
      header: 'Action',
      render: (row) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSelectedCustomer(row.id)}
          className="border-emerald-200 text-emerald-600 hover:bg-emerald-50"
        >
          View Ledger
        </Button>
      ),
      className: 'text-right'
    }
  ];

  const ledgerColumns = [
    {
      header: 'Date',
      render: (row) => format(new Date(row.date), 'dd MMM yyyy')
    },
    {
      header: 'Type',
      render: (row) => (
        <Badge variant="secondary" className={
          row.type === 'Sales Invoice' ? 'bg-emerald-100 text-emerald-700' :
          row.type === 'Purchase Invoice' ? 'bg-purple-100 text-purple-700' :
          row.type === 'Receipt' ? 'bg-blue-100 text-blue-700' :
          row.type === 'Payment' ? 'bg-orange-100 text-orange-700' :
          'bg-gray-100 text-gray-700'
        }>
          {row.type}
        </Badge>
      )
    },
    {
      header: 'Reference',
      accessor: 'reference'
    },
    {
      header: 'Debit',
      render: (row) => row.debit > 0 ? formatCurrency(row.debit) : '-',
      className: 'text-right'
    },
    {
      header: 'Credit',
      render: (row) => row.credit > 0 ? formatCurrency(row.credit) : '-',
      className: 'text-right'
    },
    {
      header: 'Balance',
      render: (row) => (
        <p className={`font-semibold ${row.balance > 0 ? 'text-red-500' : row.balance < 0 ? 'text-emerald-500' : ''}`}>
          {formatCurrency(Math.abs(row.balance))}
          {row.balance > 0 && <span className="text-xs ml-1">Dr</span>}
          {row.balance < 0 && <span className="text-xs ml-1">Cr</span>}
        </p>
      ),
      className: 'text-right'
    }
  ];

  const selectedCustomerData = customers.find(c => c.id === selectedCustomer);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#0F1724]">Ledger Report</h1>
          <p className="text-gray-500 mt-1">View party-wise ledger and outstanding balances</p>
        </div>
        <ExportButton
          data={selectedCustomer ? ledgerEntries : filteredCustomers}
          filename={selectedCustomer ? "ledger_entries" : "party_balances"}
          columns={selectedCustomer ? [
            { header: 'Date', accessor: 'date' },
            { header: 'Type', accessor: 'type' },
            { header: 'Reference', accessor: 'reference' },
            { header: 'Debit', accessor: 'debit' },
            { header: 'Credit', accessor: 'credit' },
            { header: 'Balance', accessor: 'balance' }
          ] : [
            { header: 'Name', accessor: 'name' },
            { header: 'Type', accessor: 'type' },
            { header: 'Phone', accessor: 'phone' },
            { header: 'City', accessor: 'city' },
            { header: 'Current Balance', accessor: 'current_balance' }
          ]}
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard
          title="Total Receivable"
          value={formatCurrency(summary.totalReceivable)}
          icon={TrendingUp}
          subtitle="From customers"
          gradient="from-emerald-500 to-green-600"
        />
        <StatsCard
          title="Total Payable"
          value={formatCurrency(summary.totalPayable)}
          icon={TrendingDown}
          subtitle="To suppliers"
          gradient="from-red-500 to-rose-600"
        />
        <StatsCard
          title="Total Parties"
          value={customers.length}
          icon={Users}
          subtitle={`${customers.filter(c => c.type === 'customer').length} customers, ${customers.filter(c => c.type === 'supplier').length} suppliers`}
          gradient="from-blue-500 to-indigo-600"
        />
      </div>

      {/* Party List or Ledger Detail */}
      {!selectedCustomer ? (
        <>
          {/* Filters */}
          <Card className="border-0 shadow-[0_6px_18px_rgba(15,23,36,0.06)]">
            <CardContent className="p-4">
              <div className="flex gap-4">
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-48 bg-[#F7F9FA] border-0">
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

          {/* Party List */}
          <Card className="border-0 shadow-[0_6px_18px_rgba(15,23,36,0.06)]">
            <CardContent className="p-0">
              <DataTable
                columns={customerColumns}
                data={filteredCustomers}
                isLoading={loadingCustomers}
                searchable={false}
                emptyMessage="No parties found"
              />
            </CardContent>
          </Card>
        </>
      ) : (
        <>
          {/* Ledger Header */}
          <Card className="border-0 shadow-[0_6px_18px_rgba(15,23,36,0.06)]">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-[#0F1724]">{selectedCustomerData?.name}</h2>
                  <p className="text-sm text-gray-500">
                    {selectedCustomerData?.phone} • {selectedCustomerData?.city}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Current Balance</p>
                    <p className={`text-xl font-bold ${
                      (selectedCustomerData?.current_balance || 0) > 0 
                        ? 'text-red-500' 
                        : 'text-emerald-500'
                    }`}>
                      {formatCurrency(Math.abs(selectedCustomerData?.current_balance || 0))}
                      {(selectedCustomerData?.current_balance || 0) > 0 ? ' Dr' : ' Cr'}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setSelectedCustomer('')}
                  >
                    Back to List
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ledger Entries */}
          <Card className="border-0 shadow-[0_6px_18px_rgba(15,23,36,0.06)]">
            <CardContent className="p-0">
              <DataTable
                columns={ledgerColumns}
                data={ledgerEntries}
                isLoading={loadingInvoices || loadingPayments}
                searchable={false}
                emptyMessage="No transactions found for this party"
              />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}