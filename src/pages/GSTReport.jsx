import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
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
import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns';

export default function GSTReport() {
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [activeTab, setActiveTab] = useState('gstr1');

  const { data: salesInvoices = [] } = useQuery({
    queryKey: ['salesInvoices'],
    queryFn: () => base44.entities.Invoice.filter({ invoice_type: 'sale' }, '-invoice_date'),
  });

  const { data: purchaseInvoices = [] } = useQuery({
    queryKey: ['purchaseInvoices'],
    queryFn: () => base44.entities.Invoice.filter({ invoice_type: 'purchase' }, '-invoice_date'),
  });

  const { data: creditNotes = [] } = useQuery({
    queryKey: ['creditNotes'],
    queryFn: () => base44.entities.Invoice.filter({ invoice_type: 'credit_note' }, '-invoice_date'),
  });

  const { data: debitNotes = [] } = useQuery({
    queryKey: ['debitNotes'],
    queryFn: () => base44.entities.Invoice.filter({ invoice_type: 'debit_note' }, '-invoice_date'),
  });

  // Filter by selected month
  const filteredSales = useMemo(() => {
    const monthStart = startOfMonth(new Date(selectedMonth));
    const monthEnd = endOfMonth(new Date(selectedMonth));
    return salesInvoices.filter(inv => {
      const invDate = parseISO(inv.invoice_date);
      return invDate >= monthStart && invDate <= monthEnd;
    });
  }, [salesInvoices, selectedMonth]);

  const filteredPurchases = useMemo(() => {
    const monthStart = startOfMonth(new Date(selectedMonth));
    const monthEnd = endOfMonth(new Date(selectedMonth));
    return purchaseInvoices.filter(inv => {
      const invDate = parseISO(inv.invoice_date);
      return invDate >= monthStart && invDate <= monthEnd;
    });
  }, [purchaseInvoices, selectedMonth]);

  const filteredCreditNotes = useMemo(() => {
    const monthStart = startOfMonth(new Date(selectedMonth));
    const monthEnd = endOfMonth(new Date(selectedMonth));
    return creditNotes.filter(inv => {
      const invDate = parseISO(inv.invoice_date);
      return invDate >= monthStart && invDate <= monthEnd;
    });
  }, [creditNotes, selectedMonth]);

  const filteredDebitNotes = useMemo(() => {
    const monthStart = startOfMonth(new Date(selectedMonth));
    const monthEnd = endOfMonth(new Date(selectedMonth));
    return debitNotes.filter(inv => {
      const invDate = parseISO(inv.invoice_date);
      return invDate >= monthStart && invDate <= monthEnd;
    });
  }, [debitNotes, selectedMonth]);

  // GSTR-1 Classifications
  const gstr1Data = useMemo(() => {
    // B2B - Business to Business (with GSTIN)
    const b2b = filteredSales.filter(inv => inv.customer_gstin && inv.customer_gstin.length === 15);
    
    // B2C Large - Sales > 2.5 lakhs to unregistered (interstate)
    const b2cLarge = filteredSales.filter(inv => 
      (!inv.customer_gstin || inv.customer_gstin.length !== 15) && 
      inv.grand_total > 250000 && 
      inv.is_igst
    );
    
    // B2C Small - All other B2C sales
    const b2cSmall = filteredSales.filter(inv => 
      (!inv.customer_gstin || inv.customer_gstin.length !== 15) && 
      (inv.grand_total <= 250000 || !inv.is_igst)
    );
    
    return {
      b2b,
      b2cLarge,
      b2cSmall,
      creditNotes: filteredCreditNotes,
      totalInvoices: filteredSales.length,
      totalValue: filteredSales.reduce((sum, inv) => sum + (inv.grand_total || 0), 0)
    };
  }, [filteredSales, filteredCreditNotes]);

  // GSTR-3B Summary
  const gstr3bData = useMemo(() => {
    // Outward Supplies
    const outwardTaxable = filteredSales.reduce((sum, inv) => sum + (inv.taxable_amount || 0), 0);
    const outputTax = filteredSales.reduce((sum, inv) => 
      sum + (inv.cgst_total || 0) + (inv.sgst_total || 0) + (inv.igst_total || 0), 0
    );
    
    // Inward Supplies (ITC)
    const inwardTaxable = filteredPurchases.reduce((sum, inv) => sum + (inv.taxable_amount || 0), 0);
    const inputTax = filteredPurchases.reduce((sum, inv) => 
      sum + (inv.cgst_total || 0) + (inv.sgst_total || 0) + (inv.igst_total || 0), 0
    );
    
    // Inter-state vs Intra-state
    const interState = filteredSales.filter(inv => inv.is_igst);
    const intraState = filteredSales.filter(inv => !inv.is_igst);
    
    const interStateTaxable = interState.reduce((sum, inv) => sum + (inv.taxable_amount || 0), 0);
    const interStateIGST = interState.reduce((sum, inv) => sum + (inv.igst_total || 0), 0);
    
    const intraStateTaxable = intraState.reduce((sum, inv) => sum + (inv.taxable_amount || 0), 0);
    const intraStateCGST = intraState.reduce((sum, inv) => sum + (inv.cgst_total || 0), 0);
    const intraStateSGST = intraState.reduce((sum, inv) => sum + (inv.sgst_total || 0), 0);
    
    return {
      outwardTaxable,
      outputTax,
      inwardTaxable,
      inputTax,
      netPayable: outputTax - inputTax,
      interStateTaxable,
      interStateIGST,
      intraStateTaxable,
      intraStateCGST,
      intraStateSGST
    };
  }, [filteredSales, filteredPurchases]);

  // HSN Summary (GSTR-1)
  const hsnSummary = useMemo(() => {
    const hsnMap = {};
    
    filteredSales.forEach(inv => {
      (inv.items || []).forEach(item => {
        const hsn = item.hsn_code || 'NA';
        if (!hsnMap[hsn]) {
          hsnMap[hsn] = {
            hsn_code: hsn,
            description: item.item_name || '',
            uqc: item.unit || 'PCS',
            total_quantity: 0,
            total_value: 0,
            taxable_value: 0,
            cgst: 0,
            sgst: 0,
            igst: 0,
            rate: item.gst_rate || 0
          };
        }
        hsnMap[hsn].total_quantity += item.quantity || 0;
        hsnMap[hsn].total_value += item.total_amount || 0;
        hsnMap[hsn].taxable_value += item.taxable_amount || 0;
        hsnMap[hsn].cgst += item.cgst_amount || 0;
        hsnMap[hsn].sgst += item.sgst_amount || 0;
        hsnMap[hsn].igst += item.igst_amount || 0;
      });
    });
    
    return Object.values(hsnMap).sort((a, b) => b.total_value - a.total_value);
  }, [filteredSales]);

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
    { header: 'Invoice Date', render: (row) => format(parseISO(row.invoice_date), 'dd/MM/yyyy') },
    { header: 'Customer Name', accessor: 'customer_name' },
    { header: 'GSTIN', accessor: 'customer_gstin', cellClassName: 'font-mono text-xs' },
    { header: 'Place of Supply', accessor: 'place_of_supply' },
    { header: 'Invoice Value', render: (row) => formatCurrency(row.grand_total), cellClassName: 'text-right' },
    { header: 'Taxable Value', render: (row) => formatCurrency(row.taxable_amount), cellClassName: 'text-right' },
    { header: 'Tax Amount', render: (row) => formatCurrency((row.cgst_total || 0) + (row.sgst_total || 0) + (row.igst_total || 0)), cellClassName: 'text-right' }
  ];

  const b2cLargeColumns = [
    { header: 'Invoice No', accessor: 'invoice_no' },
    { header: 'Invoice Date', render: (row) => format(parseISO(row.invoice_date), 'dd/MM/yyyy') },
    { header: 'Place of Supply', accessor: 'place_of_supply' },
    { header: 'Invoice Value', render: (row) => formatCurrency(row.grand_total), cellClassName: 'text-right' },
    { header: 'Taxable Value', render: (row) => formatCurrency(row.taxable_amount), cellClassName: 'text-right' },
    { header: 'IGST', render: (row) => formatCurrency(row.igst_total), cellClassName: 'text-right' }
  ];

  const hsnColumns = [
    { header: 'HSN Code', accessor: 'hsn_code', cellClassName: 'font-mono' },
    { header: 'Description', accessor: 'description' },
    { header: 'UQC', accessor: 'uqc' },
    { header: 'Qty', render: (row) => row.total_quantity.toFixed(2), cellClassName: 'text-right' },
    { header: 'Rate %', render: (row) => row.rate + '%', cellClassName: 'text-center' },
    { header: 'Taxable Value', render: (row) => formatCurrency(row.taxable_value), cellClassName: 'text-right' },
    { header: 'CGST', render: (row) => formatCurrency(row.cgst), cellClassName: 'text-right' },
    { header: 'SGST', render: (row) => formatCurrency(row.sgst), cellClassName: 'text-right' },
    { header: 'IGST', render: (row) => formatCurrency(row.igst), cellClassName: 'text-right' }
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
          value={formatCurrency(gstr3bData.netPayable)}
          icon={DollarSign}
          subtitle={gstr3bData.netPayable >= 0 ? 'To be paid' : 'Refund'}
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
                    {formatCurrency(gstr1Data.b2cSmall.reduce((s, i) => s + (i.taxable_amount || 0), 0))}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Total Tax</p>
                  <p className="text-2xl font-bold text-[#0F1724]">
                    {formatCurrency(gstr1Data.b2cSmall.reduce((s, i) => 
                      s + (i.cgst_total || 0) + (i.sgst_total || 0) + (i.igst_total || 0), 0
                    ))}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Credit/Debit Notes */}
          {(filteredCreditNotes.length > 0 || filteredDebitNotes.length > 0) && (
            <Card className="border-0 shadow-[0_6px_18px_rgba(15,23,36,0.06)]">
              <CardHeader className="border-b border-gray-100">
                <CardTitle className="text-lg">9B, 9C - Credit/Debit Notes</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-emerald-50 rounded-lg">
                    <p className="text-sm text-gray-500">Credit Notes (Sales Returns)</p>
                    <p className="text-xl font-bold text-emerald-600">{filteredCreditNotes.length}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {formatCurrency(filteredCreditNotes.reduce((s, i) => s + (i.grand_total || 0), 0))}
                    </p>
                  </div>
                  <div className="p-4 bg-amber-50 rounded-lg">
                    <p className="text-sm text-gray-500">Debit Notes (Purchase Returns)</p>
                    <p className="text-xl font-bold text-amber-600">{filteredDebitNotes.length}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {formatCurrency(filteredDebitNotes.reduce((s, i) => s + (i.grand_total || 0), 0))}
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
                    {formatCurrency(filteredPurchases.reduce((s, i) => s + (i.igst_total || 0), 0))}
                  </p>
                </div>
                <div className="p-4 bg-emerald-50 rounded-lg">
                  <p className="text-sm text-gray-500">CGST</p>
                  <p className="text-xl font-bold text-emerald-600">
                    {formatCurrency(filteredPurchases.reduce((s, i) => s + (i.cgst_total || 0), 0))}
                  </p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm text-gray-500">SGST</p>
                  <p className="text-xl font-bold text-purple-600">
                    {formatCurrency(filteredPurchases.reduce((s, i) => s + (i.sgst_total || 0), 0))}
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