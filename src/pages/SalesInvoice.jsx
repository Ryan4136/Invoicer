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
  Save,
  Printer,
  Search,
  User,
  Calendar,
  X,
  Eye,
  Edit2,
  Trash2,
  IndianRupee,
  TrendingUp,
  Clock,
  CheckCircle
} from 'lucide-react';
import InvoicePrintView from '@/components/invoice/InvoicePrintView';
import { format } from 'date-fns';

export default function SalesInvoice() {
  const [showForm, setShowForm] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCustomerSelect, setShowCustomerSelect] = useState(false);
  const [viewingInvoice, setViewingInvoice] = useState(null);
  const [isDraft, setIsDraft] = useState(false);
  const [page, setPage] = useState(1);
const [limit, setLimit] = useState(10);
const [total, setTotal] = useState(0);

const [statusFilter, setStatusFilter] = useState('');
const [fromDate, setFromDate] = useState('');
const [toDate, setToDate] = useState('');
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
  invoice_type: 'sale',
  invoice_date: format(new Date(), 'yyyy-MM-dd'),
  due_date: '',
  customer_id: '',
  customer_name: '',
  customer_gstin: '',
  customer_address: '',
  customer_state: '',
  customer_state_code: '',
  place_of_supply: '',
  is_igst: false,
  reverse_charge: false,
  items: [{ ...emptyLineItem }],
  notes: '',
  terms: '',
  order_id: null
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




const [orders, setOrders] = useState([]);
const [ordersLoading, setOrdersLoading] = useState(true);

useEffect(() => {
  setOrdersLoading(true);

  fetch(
    `http://localhost:8000/api/orders/list.php?page=${page}&limit=${limit}&search=${searchQuery}&status=${statusFilter}&from_date=${fromDate}&to_date=${toDate}`
  )
    .then(res => res.json())
    .then(data => {
      setOrders(data.data);
      setTotal(data.total);
    })
    .catch(err => console.error("Order fetch error:", err))
    .finally(() => setOrdersLoading(false));
}, [page, limit, searchQuery, statusFilter, fromDate, toDate]);
const [items, setItems] = useState(null);
const [itemsLoading, setItemsLoading] = useState(true);

useEffect(() => {
  fetch("http://localhost:8000/api/products/list.php")
    .then(res => res.json())
    .then(data => {
  console.log("PRODUCT API RESPONSE:", data);
  const normalized = data.map(p => ({
  id: p.id,
  name: p.name,
  item_name: p.name,
  item_code: p.code || "",
  hsn_code: p.hsn_code || "",
  unit: p.unit || "PCS",
  rate: Number(p.sale_price || 0),
  gst_rate: Number(p.gst_rate || 0),
  current_stock: Number(p.current_stock || 0),
  is_service: 0
}));

  setItems(normalized);
  console.log("STATE ITEMS:", normalized);
})
    .catch(err => console.error("Products fetch error:", err))
    .finally(() => setItemsLoading(false));
}, []);

const [customers, setCustomers] = useState([]);
const [customersLoading, setCustomersLoading] = useState(true);

useEffect(() => {
  fetch("http://localhost:8000/api/customers/list.php")
    .then(res => res.text())
    .then(text => {
      console.log("RAW CUSTOMER API:", text);

      const data = JSON.parse(text);

      const normalized = data.data.map(c => ({
        id: c.id,
        name: c.name || "Unnamed",
        phone: c.phone || "",
        gstin: c.gstin || "",
        address: c.address || "",
        city: c.city || "",
        state: c.state || "",
        state_code: c.state_code || "",
        pincode: c.pincode || ""
      }));

      setCustomers(normalized);
      setCustomersLoading(false);
    })
    .catch(err => {
      console.error("Customer fetch failed:", err);
      setCustomersLoading(false);
    });
}, []);


  const { data: company } = useQuery({
    queryKey: ['company'],
    queryFn: async () => {
      const companies = await base44.entities.Company.list();
      return companies[0];
    },
  });

const createMutation = useMutation({
  mutationFn: async (data) => {
    const res = await fetch("http://localhost:8000/api/orders/create.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    return await res.json();
  },
  onSuccess: () => {
    resetForm();
  }
});

const deleteMutation = useMutation({
  mutationFn: async (orderId) => {
    const res = await fetch(
      `http://localhost:8000/api/orders/delete.php?id=${orderId}`,
      { method: "DELETE" }
    );

    return await res.json();
  },
onSuccess: (_, orderId) => {
  setOrders(prev =>
    prev.filter(o => o.order_id !== orderId)
  );
}
});

  // Calculate totals when items change
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

  // Generate invoice number


const generateInvoiceNumber = (allInvoices) => {
  // Financial year (April–March, India)
  const today = new Date();
  const startYear = today.getMonth() >= 3
    ? today.getFullYear()
    : today.getFullYear() - 1;

  const endYear = (startYear + 1).toString().slice(-2);
  const financialYear = `${startYear}-${endYear}`;

  const prefix = "INV";

  const fyInvoices = allInvoices.filter(inv =>
    inv.invoice_no?.startsWith(`${prefix}/${financialYear}/`)
  );

  let nextNumber = 1;

  if (fyInvoices.length > 0) {
    const numbers = fyInvoices.map(inv => {
      const parts = inv.invoice_no.split('/');
      return parseInt(parts[2], 10) || 0;
    });

    nextNumber = Math.max(...numbers) + 1;
  }

  const padded = String(nextNumber).padStart(5, '0');

  setFormData(prev => ({
    ...prev,
    invoice_no: `${prefix}/${financialYear}/${padded}`
  }));
};

const resetForm = () => {
  const today = new Date();
  const startYear = today.getMonth() >= 3
    ? today.getFullYear()
    : today.getFullYear() - 1;

  const endYear = (startYear + 1).toString().slice(-2);
  const financialYear = `${startYear}-${endYear}`;
  const prefix = "INV";

  const fyInvoices = orders.filter(inv =>
    inv.invoice_no?.startsWith(`${prefix}/${financialYear}/`)
  );

  let nextNumber = 1;

  if (fyInvoices.length > 0) {
    const numbers = fyInvoices.map(inv =>
      parseInt(inv.invoice_no.split('/')[2], 10) || 0
    );
    nextNumber = Math.max(...numbers) + 1;
  }

  const padded = String(nextNumber).padStart(5, '0');

  setFormData({
    invoice_no: `${prefix}/${financialYear}/${padded}`,
    invoice_type: 'sale',
    invoice_date: format(new Date(), 'yyyy-MM-dd'),
    due_date: '',
    customer_id: '',
    customer_name: '',
    customer_gstin: '',
    customer_address: '',
    customer_state: '',
    customer_state_code: '',
    place_of_supply: '',
    is_igst: false,
    reverse_charge: false,
    items: [{ ...emptyLineItem }],
    notes: '',
    terms: '',
    order_id: null
  });

  setEditingInvoice(null);
};
const openInvoice = async (row) => {
  try {

    const res = await fetch(
      `http://localhost:8000/api/order_items/list.php?order_id=${row.order_id}`
    );

    const items = await res.json();

    const mappedItems = items.map(i => ({
      item_name: i.item_name,
      item_code: i.item_code,
      hsn_code: i.hsn_code,
      quantity: Number(i.quantity),
      unit: i.unit || "PCS",
      rate: Number(i.rate),
      taxable_amount: Number(i.taxable_amount),
      gst_rate: Number(i.gst_rate),
      cgst_amount: Number(i.cgst_amount),
      sgst_amount: Number(i.sgst_amount),
      igst_amount: Number(i.igst_amount),
      total_amount: Number(i.total_amount)
    }));

    setViewingInvoice({
      ...row,

      customer_name: row.client_name,
      customer_address: row.client_address || "",
      customer_gstin: row.client_gstin || "",

      items: mappedItems,

      subtotal: Number(row.sub_total),
      taxable_amount: Number(row.taxable_amount || 0),
cgst_total: Number(row.cgst_total || 0),
sgst_total: Number(row.sgst_total || 0),
igst_total: Number(row.igst_total || 0),  
      round_off: 0
    });

  } catch (err) {
    console.error("Invoice load failed:", err);
  }
};

  const handleCustomerSelect = (customer) => {
    const companyState = company?.state_code || '';
    const isInterState = customer.state_code && customer.state_code !== companyState;
    
    setFormData(prev => ({
      ...prev,
      customer_id: customer.id,
      customer_name: customer.name,
      customer_gstin: customer.gstin || '',
      customer_address: `${customer.address || ''}, ${customer.city || ''}, ${customer.state || ''} - ${customer.pincode || ''}`,
      customer_state: customer.state || '',
      customer_state_code: customer.state_code || '',
      place_of_supply: customer.state || '',
      is_igst: isInterState
    }));
    setShowCustomerSelect(false);
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

const handleSubmit = async (e) => {
  e.preventDefault();

const orderPayload = {
  order_date: formData.invoice_date,
  client_name: formData.customer_name,
  client_contact: "",
  sub_total: totals.subtotal,
  vat: totals.cgst_total + totals.sgst_total + totals.igst_total,
  total_amount:
  totals.taxable_amount +
  totals.cgst_total +
  totals.sgst_total +
  totals.igst_total,
  discount: totals.total_discount,
  grand_total: totals.grand_total,
  paid: 0,
  due: totals.grand_total,
  payment_type: "cash",
  payment_status: isDraft ? "draft" : "unpaid",
  payment_place: "store",
  order_status: isDraft ? 0 : 1
};

  try {
    // 1️⃣ Create order
    const orderRes = await fetch("http://localhost:8000/api/orders/create.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderPayload)
    });

    const orderData = await orderRes.json();

    // 2️⃣ Create order items
    await fetch("http://localhost:8000/api/order_items/create.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        order_id: orderData.order_id,
        items: formData.items
      })
    });

alert(isDraft ? "Draft Saved Successfully" : "Invoice Created Successfully");

setIsDraft(false);
resetForm();

  } catch (error) {
    console.error(error);
    alert("Invoice creation failed");
  }
};

  const handleDelete = (invoice) => {
    if (confirm('Are you sure you want to delete this invoice?')) {
      deleteMutation.mutate(invoice.order_id);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const generateFromOrder = async (order) => {
  // Prevent duplicate invoice
  const existingInvoice = orders.find(
    inv => inv.order_id === order.order_id
  );

  if (existingInvoice) {
    alert("Invoice already created for this order.");
    return;
  }



  const companyState = company?.state_code || '';
  const isInterState =
    order.customer_state_code &&
    order.customer_state_code !== companyState;
const orderItems = order.items || [];
  const mappedItems = orderItems.map(item => {
    const taxable =
      item.quantity * item.rate - (item.discount || 0);

    const gstRate = item.gst_rate || 18;
    const gstAmount = (taxable * gstRate) / 100;

    return {
      item_id: item.item_id,
      item_name: item.item_name,
      item_code: item.item_code,
      hsn_code: item.hsn_code,
      quantity: item.quantity,
      unit: item.unit || 'PCS',
      rate: item.rate,
      discount_percent: 0,
      discount_amount: item.discount || 0,
      taxable_amount: taxable,
      gst_rate: gstRate,
      cgst_amount: isInterState ? 0 : gstAmount / 2,
      sgst_amount: isInterState ? 0 : gstAmount / 2,
      igst_amount: isInterState ? gstAmount : 0,
      total_amount: taxable + gstAmount,
    };
  });

setFormData(prev => ({
  ...prev,
  customer_name: order.client_name,
  customer_gstin: order.clgstin,
  invoice_date: order.order_date,
  order_id: order.order_id
}));

  setShowForm(true);
};

const columns = [
  {
    header: '#',
    render: (row, index) => (
      <span className="text-gray-500 text-sm">
        {(page - 1) * limit + index + 1}
      </span>
    )
  },
  {
    header: 'Invoice',
    render: (row) => (
      <div>
        <p className="font-medium text-[#0F1724]">
          {row.invoice_no || `INV-${row.order_id}`}
        </p>
        <p className="text-xs text-gray-400">
          {row.order_date
            ? format(new Date(row.order_date), 'dd MMM yyyy')
            : '-'}
        </p>
      </div>
    )
  },
  {
    header: 'Customer',
    render: (row) => (
      <div>
        <p className="font-medium">{row.client_name || '-'}</p>
      </div>
    )
  },
  {
    header: 'Subtotal',
    render: (row) => (
      <span>{formatCurrency(Number(row.sub_total))}</span>
    ),
    className: 'text-right'
  },
  {
    header: 'Tax (VAT)',
    render: (row) => (
      <span>{formatCurrency(Number(row.vat))}</span>
    ),
    className: 'text-right'
  },
  {
    header: 'Discount',
    render: (row) => (
      <span>{formatCurrency(Number(row.discount))}</span>
    ),
    className: 'text-right'
  },
  {
    header: 'Grand Total',
    render: (row) => (
      <p className="font-semibold text-[#0F1724]">
        {formatCurrency(Number(row.grand_total))}
      </p>
    ),
    className: 'text-right'
  },
  {
    header: 'Paid',
    render: (row) => (
      <span className="text-emerald-600">
        {formatCurrency(Number(row.paid))}
      </span>
    ),
    className: 'text-right'
  },
  {
    header: 'Due',
    render: (row) => (
      <span className="text-red-600">
        {formatCurrency(Number(row.due))}
      </span>
    ),
    className: 'text-right'
  },
  {
    header: 'Payment',
    render: (row) => (
      <Badge variant="secondary">
        {row.payment_type || 'N/A'}
      </Badge>
    )
  },
  {
    header: 'Status',
    render: (row) => {
      const isPaid = Number(row.due) <= 0;

      return (
        <Badge
          className={
            isPaid
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-red-100 text-red-700'
          }
        >
          {isPaid ? 'Paid' : 'Unpaid'}
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
            onClick={(e) => {
  e.stopPropagation();
  openInvoice(row);
}}
          >
            <Eye className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-gray-400 hover:text-blue-600"
onClick={(e) => {
  e.stopPropagation();
  openInvoice(row);
}}
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

const filteredOrders = orders.filter(order => {
  const matchesSearch =
    !searchQuery ||
    order.order_id?.toString().includes(searchQuery) ||
    order.client_name?.toLowerCase().includes(searchQuery.toLowerCase());

  const matchesFrom = !fromDate || order.order_date >= fromDate;
  const matchesTo = !toDate || order.order_date <= toDate;

  return matchesSearch && matchesFrom && matchesTo;
});

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#0F1724]">Sales Invoices</h1>
          <p className="text-gray-500 mt-1">Create and manage your sales invoices</p>
        </div>
        <Button
          className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-lg shadow-emerald-500/20"
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          New Invoice
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            title: 'Total Revenue',
            value: formatCurrency(filteredOrders.reduce((sum, o) => sum + Number(o.grand_total || 0), 0)),
            icon: TrendingUp,
            iconBg: 'bg-indigo-100',
            iconColor: 'text-indigo-600'
          },
          {
            title: 'Total Invoices',
            value: total,
            icon: FileText,
            iconBg: 'bg-violet-100',
            iconColor: 'text-violet-600'
          },
          {
            title: 'Total Paid',
            value: formatCurrency(filteredOrders.reduce((sum, o) => sum + Number(o.paid || 0), 0)),
            icon: CheckCircle,
            iconBg: 'bg-emerald-100',
            iconColor: 'text-emerald-600'
          },
          {
            title: 'Total Due',
            value: formatCurrency(filteredOrders.reduce((sum, o) => sum + Number(o.due || 0), 0)),
            icon: Clock,
            iconBg: 'bg-rose-100',
            iconColor: 'text-rose-600'
          },
        ].map(({ title, value, icon: Icon, iconBg, iconColor }) => (
          <Card key={title} className="border-0 shadow-[0_6px_18px_rgba(15,23,36,0.06)]">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${iconBg}`}>
                  <Icon className={`w-5 h-5 ${iconColor}`} />
                </div>
                <div>
                  <p className="text-sm text-gray-500">{title}</p>
                  <p className="text-xl font-bold text-[#0F1724] mt-0.5">{value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
<div className="flex items-center gap-4 mb-4">

  <select
    value={limit}
    onChange={(e) => {
      setLimit(Number(e.target.value));
      setPage(1);
    }}
    className="border px-2 py-1 rounded"
  >
    <option value={5}>5</option>
    <option value={10}>10</option>
    <option value={25}>25</option>
    <option value={50}>50</option>
  </select>

</div>
<div className="flex gap-2 mb-4">

  <input
    type="date"
    value={fromDate}
    onChange={(e) => setFromDate(e.target.value)}
    className="border px-2 py-1 rounded"
  />

  <input
    type="date"
    value={toDate}
    onChange={(e) => setToDate(e.target.value)}
    className="border px-2 py-1 rounded"
  />

</div>
      {/* Invoice List */}
      <Card className="border-0 shadow-[0_6px_18px_rgba(15,23,36,0.06)]">
        <CardHeader className="pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search invoices..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-[#F7F9FA] border-0 max-w-sm"
            />
          </div>
          
        </CardHeader>
        
        <CardContent className="p-0">
          
          <DataTable
            columns={columns}
            data={filteredOrders}
            isLoading={ordersLoading}
            searchable={false}
            emptyMessage="No invoices found. Create your first invoice to get started."
          />

        </CardContent>
        
      </Card>
             <div className="flex items-center justify-end gap-3 mt-6">

  {/* PREV (only if not first page) */}
  {page > 1 && (
    <button
      onClick={() => setPage(p => p - 1)}
      className="px-3 py-1 rounded-lg text-sm bg-white/20 backdrop-blur-md border border-white/30 shadow hover:bg-white/30 transition"
    >
      ←
    </button>
  )}

  {/* PAGE NUMBERS (SMART RANGE) */}
  {(() => {
    const totalPages = Math.ceil(total / limit);
    const range = 2; // pages before & after current

    let start = Math.max(1, page - range);
    let end = Math.min(totalPages, page + range);

    // ensure at least 5 buttons if possible
    if (page <= range) {
      end = Math.min(totalPages, 1 + range * 2);
    }
    if (page + range >= totalPages) {
      start = Math.max(1, totalPages - range * 2);
    }

    return Array.from({ length: end - start + 1 }, (_, i) => {
      const pageNum = start + i;

      return (
        <button
          key={pageNum}
          onClick={() => setPage(pageNum)}
          className={`px-3 py-1 rounded-lg text-sm transition-all duration-300
            ${
              page === pageNum
                ? "bg-gradient-to-br from-emerald-400/80 to-green-500/80 text-white shadow-[0_0_10px_rgba(34,197,94,0.6)]"
                : "bg-white/20 backdrop-blur-md border border-white/30 hover:bg-white/30"
            }
          `}
        >
          {pageNum}
        </button>
      );
    });
  })()}

  {/* NEXT (only if not last page) */}
  {page * limit < total && (
    <button
      onClick={() => setPage(p => p + 1)}
      className="px-3 py-1 rounded-lg text-sm bg-white/20 backdrop-blur-md border border-white/30 shadow hover:bg-white/30 transition"
    >
      →
    </button>
  )}

</div>

      {/* Invoice Form Dialog */}
      <Dialog
  open={showForm}
  onOpenChange={(open) => {
    if (!open) {
      resetForm();
      setShowForm(false);
    }
  }}
>
        <DialogContent className="w-[95vw] max-w-[1400px] max-h-[95vh] overflow-y-auto">  
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <FileText className="w-5 h-5" />
              {editingInvoice ? 'Edit Invoice' : 'New Sales Invoice'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Header Section */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label>Invoice No.</Label>
                <Input
                  value={formData.invoice_no}
                  onChange={(e) => setFormData({ ...formData, invoice_no: e.target.value })}
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
                <Label>Place of Supply</Label>
                <Input
                  value={formData.place_of_supply}
                  onChange={(e) => setFormData({ ...formData, place_of_supply: e.target.value })}
                  className="mt-1.5"
                />
              </div>
            </div>

            {/* Customer Section */}
            <Card className="border border-gray-100">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Customer Details
                  </CardTitle>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowCustomerSelect(true)}
                  >
                    <Search className="w-4 h-4 mr-1" />
                    Select Customer
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
  <div className="min-w-[100px]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Customer Name *</Label>
                    <Input
                      value={formData.customer_name}
                      onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                      className="mt-1.5"
                      required
                    />
                  </div>
                  <div>
                    <Label>GSTIN</Label>
                    <Input
                      value={formData.customer_gstin}
                      onChange={(e) => setFormData({ ...formData, customer_gstin: e.target.value })}
                      className="mt-1.5 font-mono"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Address</Label>
                    <Input
                      value={formData.customer_address}
                      onChange={(e) => setFormData({ ...formData, customer_address: e.target.value })}
                      className="mt-1.5"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-6 mt-4">
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
                </div>
              </CardContent>
            </Card>

            {/* Line Items */}
            <Card className="border border-gray-100">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Invoice Items</CardTitle>
              </CardHeader>
              <CardContent className="">
  <div className="w-full">
                {/* Header Row */}
                <div className="hidden md:grid grid-cols-12 gap-2 px-3 py-2 bg-gray-50 rounded-lg mb-2 text-xs font-medium text-gray-500">
                  <div className="col-span-3">Item</div>
                  <div className="col-span-1">HSN</div>
                  <div className="col-span-1">Qty</div>
                  <div className="col-span-1">Unit</div>
                  <div className="col-span-2">Rate</div>
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
    items={items || []}
  />
))}
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={addLineItem}
                  className="mt-2 border-dashed border-gray-300"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Line Item
                </Button>
                </div>
</CardContent>
            </Card>

            {/* Summary & Notes */}
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
                    placeholder="Payment terms..."
                    className="mt-1.5"
                    rows={3}
                  />
                </div>
              </div>
              
              <InvoiceSummary invoice={totals} isIGST={formData.is_igst} />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
  type="button"
  variant="outline"
  onClick={() => {
    resetForm();
    setShowForm(false);
  }}
>
                Cancel
              </Button>
<Button
  type="submit"
  variant="outline"
  onClick={() => setIsDraft(true)}
>
  <Save className="w-4 h-4 mr-2" />
  Save Draft
</Button>
              <Button 
                type="submit" 
                className="bg-gradient-to-r from-emerald-500 to-green-600"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? 'Saving...' : 'Create Invoice'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Invoice Print View */}
      {viewingInvoice && (
        <InvoicePrintView 
          invoice={viewingInvoice} 
          company={company} 
          onClose={() => setViewingInvoice(null)} 
        />
      )}

      {/* Customer Select Dialog */}
      <Dialog open={showCustomerSelect} onOpenChange={setShowCustomerSelect}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Select Customer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Search customers..."
              className="bg-[#F7F9FA] border-0"
            />
            <div className="max-h-64 overflow-y-auto space-y-2">
              {customers.map(customer => (
                <button
                  key={customer.id}
                  type="button"
                  onClick={() => handleCustomerSelect(customer)}
                  className="w-full p-3 rounded-lg bg-gray-50 hover:bg-emerald-50 text-left transition-colors"
                >
                  <p className="font-medium text-[#0F1724]">{customer.name}</p>
                  <p className="text-sm text-gray-500">
                    {customer.gstin || 'No GSTIN'} • {customer.city}, {customer.state}
                  </p>
                </button>
                
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}