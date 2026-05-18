import React, { useState, useMemo } from 'react';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DataTable from '@/components/ui/DataTable';
import StatsCard from '@/components/ui/StatsCard';
import {
  FileText,
  Download,
  TrendingUp,
  DollarSign,
  Receipt,
  Building2,
  Users,
  Package
} from 'lucide-react';
import { format } from 'date-fns';

export default function GSTReport() {
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [activeTab, setActiveTab] = useState('gstr1');

const { data: gstData, isLoading } = useQuery({

  queryKey: ['gst-report', selectedMonth],

  queryFn: async () => {

    const response = await fetch(
      `http://localhost:8000/api/gst/report.php?month=${selectedMonth}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch GST report');
    }

    return response.json();
  }
});

const summary = gstData?.summary || {};

const gstr1 = gstData?.gstr1 || {};

const salesInvoices = gstData?.sales || [];

const purchaseInvoices = gstData?.purchases || [];

const creditNotes = gstData?.credit_notes || [];

const debitNotes = gstData?.debit_notes || [];

const hsnSummary = gstData?.hsn_summary || [];


  // Filter by selected month





  // GSTR-1 Classifications
const gstr1Data = {

  b2b: gstr1.b2b || [],

  b2cLarge: gstr1.b2c_large || [],

  b2cSmall: gstr1.b2c_small || [],

  creditNotes,

  totalInvoices: salesInvoices.length,

  totalValue: salesInvoices.reduce(
    (sum, inv) => sum + Number(inv.grand_total || 0),
    0
  )
};

  // GSTR-3B Summary
const gstr3bData = {

  outwardTaxable: Number(summary.outward_taxable || 0),

  outputTax: Number(summary.output_tax || 0),

  inwardTaxable: Number(summary.inward_taxable || 0),

  inputTax: Number(summary.input_tax || 0),

  netPayable: Number(summary.net_payable || 0),

  interStateTaxable: Number(summary.interstate_taxable || 0),

  interStateIGST: Number(summary.interstate_igst || 0),

  intraStateTaxable: Number(summary.intrastate_taxable || 0),

  intraStateCGST: Number(summary.intrastate_cgst || 0),

  intraStateSGST: Number(summary.intrastate_sgst || 0),
};

  // HSN Summary (GSTR-1)


  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  // GSTR-1 Table Columns
  const b2bColumns = [
    { header: 'Invoice No', accessor: 'invoice_no' },
    { header: 'Invoice Date', render: (row) => format(new Date(row.order_date), 'dd/MM/yyyy') },
    { header: 'Customer Name', accessor: 'client_name' },
    { header: 'GSTIN', accessor: 'customer_gstin', cellClassName: 'font-mono text-xs' },
    { header: 'Place of Supply', accessor: 'place_of_supply' },
    { header: 'Invoice Value', render: (row) => formatCurrency(row.grand_total), cellClassName: 'text-right' },
    { header: 'Taxable Value', render: (row) => formatCurrency(row.taxable_amount), cellClassName: 'text-right' },
    { header: 'Tax Amount', render: (row) => formatCurrency((row.cgst_total || 0) + (row.sgst_total || 0) + (row.igst_total || 0)), cellClassName: 'text-right' }
  ];

  const b2cLargeColumns = [
    { header: 'Invoice No', accessor: 'invoice_no' },
    { header: 'Invoice Date', render: (row) => format(new Date(row.order_date), 'dd/MM/yyyy') },
    { header: 'Place of Supply', accessor: 'place_of_supply' },
    { header: 'Invoice Value', render: (row) => formatCurrency(row.grand_total), cellClassName: 'text-right' },
    { header: 'Taxable Value', render: (row) => formatCurrency(row.taxable_amount), cellClassName: 'text-right' },
    { header: 'IGST', render: (row) => formatCurrency(row.igst_total), cellClassName: 'text-right' }
  ];

const hsnColumns = [

  {
    header: 'GST Rate',
    render: (row) => `${row.gst_rate}%`
  },

  {
    header: 'Taxable Value',
    render: (row) => formatCurrency(row.taxable_value),
    cellClassName: 'text-right'
  },

  {
    header: 'CGST',
    render: (row) => formatCurrency(row.cgst),
    cellClassName: 'text-right'
  },

  {
    header: 'SGST',
    render: (row) => formatCurrency(row.sgst),
    cellClassName: 'text-right'
  },

  {
    header: 'IGST',
    render: (row) => formatCurrency(row.igst),
    cellClassName: 'text-right'
  },

  {
    header: 'Invoices',
    accessor: 'invoices'
  }
];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#0F1724]">GST Returns</h1>
          <p className="text-gray-500 mt-1">GSTR-1 & GSTR-3B compliant reports as per Indian GST regulations</p>
        </div>
        <div className="flex gap-3">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => {
                const date = new Date();
                date.setMonth(date.getMonth() - i);
                const value = format(date, 'yyyy-MM');
                return (
                  <SelectItem key={value} value={value}>
                    {format(date, 'MMMM yyyy')}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          <Button variant="outline" className="border-gray-200">
            <Download className="w-4 h-4 mr-2" />
            Export JSON
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Outward Supply"
          value={formatCurrency(gstr3bData.outwardTaxable)}
          icon={TrendingUp}
          subtitle={`${gstr1Data.totalInvoices} invoices`}
          gradient="from-emerald-500 to-green-600"
        />
        <StatsCard
          title="Output Tax Liability"
          value={formatCurrency(gstr3bData.outputTax)}
          icon={Receipt}
          subtitle="On sales"
          gradient="from-amber-500 to-orange-600"
        />
        <StatsCard
          title="Input Tax Credit (ITC)"
          value={formatCurrency(gstr3bData.inputTax)}
          icon={TrendingUp}
          subtitle="Available"
          gradient="from-blue-500 to-indigo-600"
        />
        <StatsCard
          title="Net GST Payable"
          value={formatCurrency(Math.abs(gstr3bData.netPayable))}
          icon={DollarSign}
          subtitle={gstr3bData.netPayable >= 0 ? 'To be paid' : 'Excess ITC'}
          gradient={gstr3bData.netPayable >= 0 ? 'from-red-500 to-rose-600' : 'from-green-500 to-emerald-600'}
        />
      </div>

      {/* GSTR-1 & GSTR-3B Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-blue-100">
                <Building2 className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#0F1724]">{gstr1Data.b2b.length}</p>
                <p className="text-sm text-gray-500">B2B Invoices</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-purple-100">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#0F1724]">{gstr1Data.b2cLarge.length}</p>
                <p className="text-sm text-gray-500">B2C Large</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-amber-100">
                <Package className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#0F1724]">{hsnSummary.length}</p>
                <p className="text-sm text-gray-500">HSN Codes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* GSTR-1 & GSTR-3B Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-[#F7F9FA]">
          <TabsTrigger value="gstr1">GSTR-1 (Outward Supplies)</TabsTrigger>
          <TabsTrigger value="gstr3b">GSTR-3B (Summary Return)</TabsTrigger>
          <TabsTrigger value="hsn">HSN Summary</TabsTrigger>
        </TabsList>

        {/* GSTR-1 */}
        <TabsContent value="gstr1" className="mt-4 space-y-4">
          {/* B2B Invoices */}
          <Card className="border-0 shadow-[0_6px_18px_rgba(15,23,36,0.06)]">
            <CardHeader className="border-b border-gray-100">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">4A, 4B, 4C, 6B, 6C - B2B Invoices</CardTitle>
                <Badge className="bg-blue-100 text-blue-700">{gstr1Data.b2b.length} invoices</Badge>
              </div>
              <p className="text-sm text-gray-500">Taxable outward supplies to registered persons</p>
            </CardHeader>
            <CardContent className="p-0">
              <DataTable
                columns={b2bColumns}
                data={gstr1Data.b2b}
                searchable={false}
                emptyMessage="No B2B invoices"
              />
            </CardContent>
          </Card>

          {/* B2C Large */}
          <Card className="border-0 shadow-[0_6px_18px_rgba(15,23,36,0.06)]">
            <CardHeader className="border-b border-gray-100">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">5A, 5B - B2C (Large) Invoices</CardTitle>
                <Badge className="bg-purple-100 text-purple-700">{gstr1Data.b2cLarge.length} invoices</Badge>
              </div>
              <p className="text-sm text-gray-500">Interstate sales to unregistered persons {'>'} ₹2.5 lakhs</p>
            </CardHeader>
            <CardContent className="p-0">
              <DataTable
                columns={b2cLargeColumns}
                data={gstr1Data.b2cLarge}
                searchable={false}
                emptyMessage="No B2C Large invoices"
              />
            </CardContent>
          </Card>

          {/* B2C Small Summary */}
          <Card className="border-0 shadow-[0_6px_18px_rgba(15,23,36,0.06)]">
            <CardHeader className="border-b border-gray-100">
              <CardTitle className="text-lg">7 - B2C (Others) Summary</CardTitle>
              <p className="text-sm text-gray-500">All other B2C sales (intra-state and interstate {'<'} ₹2.5 lakhs)</p>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Number of Invoices</p>
                  <p className="text-2xl font-bold text-[#0F1724]">{gstr1Data.b2cSmall.length}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Total Taxable Value</p>
                  <p className="text-2xl font-bold text-[#0F1724]">
                    {formatCurrency(gstr1Data.b2cSmall.reduce((s, i) => s + Number(i.taxable_amount || 0), 0))}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Total Tax</p>
                  <p className="text-2xl font-bold text-[#0F1724]">
                    {formatCurrency(gstr1Data.b2cSmall.reduce((s, i) => 
                      s +
Number(i.cgst_total || 0) +
Number(i.sgst_total || 0) +
Number(i.igst_total || 0), 0
                    ))}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Credit/Debit Notes */}
          {(creditNotes.length > 0 || debitNotes.length > 0) && (
            <Card className="border-0 shadow-[0_6px_18px_rgba(15,23,36,0.06)]">
              <CardHeader className="border-b border-gray-100">
                <CardTitle className="text-lg">9B, 9C - Credit/Debit Notes</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-emerald-50 rounded-lg">
                    <p className="text-sm text-gray-500">Credit Notes (Sales Returns)</p>
                    <p className="text-xl font-bold text-emerald-600">{creditNotes.length}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {formatCurrency(creditNotes.reduce((s, i) => s + Number(i.grand_total || 0), 0))}
                    </p>
                  </div>
                  <div className="p-4 bg-amber-50 rounded-lg">
                    <p className="text-sm text-gray-500">Debit Notes (Purchase Returns)</p>
                    <p className="text-xl font-bold text-amber-600">{debitNotes.length}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {formatCurrency(debitNotes.reduce((s, i) => s + Number(i.grand_total || 0), 0))}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* GSTR-3B */}
        <TabsContent value="gstr3b" className="mt-4 space-y-4">
          {/* Table 3.1 - Outward Supplies */}
          <Card className="border-0 shadow-[0_6px_18px_rgba(15,23,36,0.06)]">
            <CardHeader className="border-b border-gray-100">
              <CardTitle className="text-lg">Table 3.1 - Details of Outward Supplies</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#F7F9FA]">
                    <tr>
                      <th className="text-left p-4 font-semibold text-[#0F1724]">Nature of Supplies</th>
                      <th className="text-right p-4 font-semibold text-[#0F1724]">Taxable Value</th>
                      <th className="text-right p-4 font-semibold text-[#0F1724]">IGST</th>
                      <th className="text-right p-4 font-semibold text-[#0F1724]">CGST</th>
                      <th className="text-right p-4 font-semibold text-[#0F1724]">SGST</th>
                      <th className="text-right p-4 font-semibold text-[#0F1724]">Cess</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-100">
                      <td className="p-4">(a) Outward taxable supplies (other than zero rated, nil rated and exempted)</td>
                      <td className="p-4 text-right font-medium">{formatCurrency(gstr3bData.outwardTaxable)}</td>
                      <td className="p-4 text-right">{formatCurrency(gstr3bData.interStateIGST)}</td>
                      <td className="p-4 text-right">{formatCurrency(gstr3bData.intraStateCGST)}</td>
                      <td className="p-4 text-right">{formatCurrency(gstr3bData.intraStateSGST)}</td>
                      <td className="p-4 text-right">₹0.00</td>
                    </tr>
                    <tr className="bg-[#F7F9FA] font-semibold">
                      <td className="p-4">Total</td>
                      <td className="p-4 text-right">{formatCurrency(gstr3bData.outwardTaxable)}</td>
                      <td className="p-4 text-right">{formatCurrency(gstr3bData.interStateIGST)}</td>
                      <td className="p-4 text-right">{formatCurrency(gstr3bData.intraStateCGST)}</td>
                      <td className="p-4 text-right">{formatCurrency(gstr3bData.intraStateSGST)}</td>
                      <td className="p-4 text-right">₹0.00</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Table 4 - ITC */}
          <Card className="border-0 shadow-[0_6px_18px_rgba(15,23,36,0.06)]">
            <CardHeader className="border-b border-gray-100">
              <CardTitle className="text-lg">Table 4 - Eligible ITC</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-4 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-500">IGST</p>
                  <p className="text-xl font-bold text-blue-600">
                    {formatCurrency(purchaseInvoices.reduce((s, i) => s + Number(i.igst_total || 0), 0))}
                  </p>
                </div>
                <div className="p-4 bg-emerald-50 rounded-lg">
                  <p className="text-sm text-gray-500">CGST</p>
                  <p className="text-xl font-bold text-emerald-600">
                    {formatCurrency(gstr3bData.inputTax / 2)}
                  </p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm text-gray-500">SGST</p>
                  <p className="text-xl font-bold text-purple-600">
                    {formatCurrency(gstr3bData.inputTax / 2)}
                  </p>
                </div>
                <div className="p-4 bg-amber-50 rounded-lg">
                  <p className="text-sm text-gray-500">Total ITC</p>
                  <p className="text-xl font-bold text-amber-600">
                    {formatCurrency(gstr3bData.inputTax)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Table 6.1 - Payment */}
          <Card className="border-0 shadow-[0_6px_18px_rgba(15,23,36,0.06)]">
            <CardHeader className="border-b border-gray-100">
              <CardTitle className="text-lg">Table 6.1 - Payment of Tax</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-red-50 rounded-lg">
                  <span className="font-medium">Tax Payable</span>
                  <span className="text-xl font-bold text-red-600">{formatCurrency(gstr3bData.outputTax)}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                  <span className="font-medium">ITC Available</span>
                  <span className="text-xl font-bold text-green-600">-{formatCurrency(gstr3bData.inputTax)}</span>
                </div>
                <div className="h-px bg-gray-200" />
                <div className="flex justify-between items-center p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg border-2 border-emerald-200">
                  <span className="text-lg font-semibold">Net Tax Payable</span>
                  <span className="text-2xl font-bold text-emerald-600">
                    {formatCurrency(Math.max(0, gstr3bData.netPayable))}
                  </span>
                </div>
                <p className="text-sm text-gray-500 text-center">
                  To be paid to the Government through cash/ITC ledger
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* HSN Summary */}
        <TabsContent value="hsn" className="mt-4">
          <Card className="border-0 shadow-[0_6px_18px_rgba(15,23,36,0.06)]">
            <CardHeader className="border-b border-gray-100">
              <CardTitle className="text-lg">HSN-wise Summary of Outward Supplies</CardTitle>
              <p className="text-sm text-gray-500">As per GSTR-1 Table 12</p>
            </CardHeader>
            <CardContent className="p-0">
              <DataTable
                columns={hsnColumns}
                data={hsnSummary}
                searchable={false}
                emptyMessage="No HSN data available"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}