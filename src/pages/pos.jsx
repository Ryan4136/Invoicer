  import React, { useState, useEffect, useCallback } from 'react';
  import { base44 } from '@/api/base44Client';
  import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
  import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
  import { Button } from '@/components/ui/button';
  import { Input } from '@/components/ui/input';
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
  import POSKeypad from '@/components/pos/POSKeypad';
  import POSCartItem from '@/components/pos/POSCartItem';
  import {
    Search,
    User,
    ShoppingCart,
    Printer,
    Save,
    X,
    Plus,
    Minus,
    CreditCard,
    Banknote,
    Smartphone,
    Receipt,
    Barcode,
    Clock
  } from 'lucide-react';
  import { format } from 'date-fns';

  export default function POS() {
    const [cart, setCart] = useState([]);
    const [customer, setCustomer] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [customerSearchQuery, setCustomerSearchQuery] = useState('');
    const [showCustomerSearch, setShowCustomerSearch] = useState(false);
    const [paymentMode, setPaymentMode] = useState('cash');
    const [amountReceived, setAmountReceived] = useState('');
    const [showPaymentDialog, setShowPaymentDialog] = useState(false);
    const [discount, setDiscount] = useState(0);
    
    const queryClient = useQueryClient();

  const [items, setItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(true);

useEffect(() => {
  fetch("http://localhost:8000/api/products/list.php")
    .then(res => res.json())
    .then(data => {

      const normalized = data.map(p => ({
        product_id: p.id,
        product_name: p.name,

        hsn: p.hsn_code || p.hsn || "—",

        rate:
          parseFloat(p.rate) ||
          parseFloat(p.selling_price) ||
          parseFloat(p.price) ||
          parseFloat(p.mrp) ||
          0,

        // ✅ CRITICAL FIX FOR QUANTITY
        quantity:
          Number(p.quantity) ||
          Number(p.stock) ||
          Number(p.current_stock) ||
          Number(p.available_qty) ||
          Number(p.qty) ||
          0,

        gst_rate: parseFloat(p.gst_rate || 0)
      }));

      console.log("Normalized items:", normalized); // keep this for 1 refresh

      setItems(normalized);
      setLoadingItems(false);
    });
}, []);





const [customers, setCustomers] = useState([]);
const [loadingCustomers, setLoadingCustomers] = useState(true);

useEffect(() => {
  fetch("http://localhost:8000/api/customers/list.php")
    .then(res => res.text())   // <-- FIRST read as text
    .then(text => {
      console.log("RAW API RESPONSE:", text); // Debug

      const data = JSON.parse(text); // Now parse safely

      const normalizedCustomers = data.map(c => ({
        id: c.id,
        name: c.name || "Unnamed",
        phone: c.phone || "",
        gstin: c.gstin || ""
      }));

      setCustomers(normalizedCustomers);
      setLoadingCustomers(false);
    })
    .catch(err => {
      console.error("Customer load failed:", err);
      setLoadingCustomers(false);
    });
}, []);



    const { data: company } = useQuery({
      queryKey: ['company'],
      queryFn: async () => {
        const companies = await base44.entities.Company.list();
        return companies[0];
      },
    });

    const createInvoiceMutation = useMutation({
      mutationFn: async (invoiceData) => {
        const invoice = await base44.entities.Invoice.create(invoiceData);
        
        // Update stock for each item
        for (const item of invoiceData.items) {
          const currentItem = items.find(i => i.product_id === item.item_id);
          if (currentItem && !currentItem.is_service) {
            const newStock = (currentItem.quantity || 0) - item.quantity;
            await base44.entities.Item.update(item.item_id, { current_stock: newStock });
            
            // Create stock entry
            await base44.entities.StockEntry.create({
              entry_type: 'sale',
              item_id: item.item_id,
              item_name: item.item_name,
              quantity: -item.quantity,
              unit: item.unit,
              rate: item.rate,
              total_value: item.total_amount,
              reference_type: 'invoice',
              reference_id: invoice.id,
              reference_no: invoice.invoice_no,
              stock_before: currentItem.quantity,
              stock_after: newStock,
              company_id: company?.id
            });
          }
        }
        
        // Update company invoice counter
        if (company) {
          await base44.entities.Company.update(company.id, {
            invoice_counter: (company.invoice_counter || 1) + 1
          });
        }
        
        return invoice;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['items'] });
        queryClient.invalidateQueries({ queryKey: ['invoices'] });
        queryClient.invalidateQueries({ queryKey: ['company'] });
        clearCart();
        setShowPaymentDialog(false);
      },
    });

    // Calculate totals
    const calculateTotals = useCallback(() => {
      let subtotal = 0;
      let totalDiscount = 0;
      let taxableAmount = 0;
      let cgstTotal = 0;
      let sgstTotal = 0;
      
      cart.forEach(item => {
        const lineTotal = item.quantity * item.rate;
        const lineDiscount = (lineTotal * (item.discount_percent || 0)) / 100;
        const lineTaxable = lineTotal - lineDiscount;
        const lineGst = (lineTaxable * item.gst_rate) / 100;
        
        subtotal += lineTotal;
        totalDiscount += lineDiscount;
        taxableAmount += lineTaxable;
        cgstTotal += lineGst / 2;
        sgstTotal += lineGst / 2;
      });
      
      // Apply additional discount
      const additionalDiscount = (taxableAmount * discount) / 100;
      taxableAmount -= additionalDiscount;
      totalDiscount += additionalDiscount;
      
      const grandTotal = taxableAmount + cgstTotal + sgstTotal;
      const roundOff = Math.round(grandTotal) - grandTotal;
      
      return {
        subtotal,
        totalDiscount,
        taxableAmount,
        cgstTotal,
        sgstTotal,
        roundOff,
        grandTotal: Math.round(grandTotal)
      };
    }, [cart, discount]);

    const totals = calculateTotals() || {
    subtotal: 0,
    totalDiscount: 0,
    cgstTotal: 0,
    sgstTotal: 0,
    roundOff: 0,
    grandTotal: 0
  };

    // Add item to cart
    const addToCart = (item) => {
      const existingIndex = cart.findIndex(c => c.item_id === item.product_id);
      
      if (existingIndex >= 0) {
        const newCart = [...cart];
        newCart[existingIndex].quantity += 1;
        newCart[existingIndex] = calculateLineItem(newCart[existingIndex]);
        setCart(newCart);
      } else {
  const lineItem = calculateLineItem({
    item_id: item.product_id,
    item_name: item.product_name,
    item_code: item.hsn || '',
    rate: parseFloat(item.rate),
    gst_rate: parseFloat(item.gst_rate),
    quantity: 1,
    discount_percent: 0
  });


        setCart([...cart, lineItem]);
      }
      setSearchQuery('');
    };

    const calculateLineItem = (item) => {
      const lineTotal = item.quantity * item.rate;
      const discountAmount = (lineTotal * (item.discount_percent || 0)) / 100;
      const taxableAmount = lineTotal - discountAmount;
      const gstAmount = (taxableAmount * item.gst_rate) / 100;
      
      return {
        ...item,
        discount_amount: discountAmount,
        taxable_amount: taxableAmount,
        cgst_amount: gstAmount / 2,
        sgst_amount: gstAmount / 2,
        igst_amount: 0,
        total_amount: taxableAmount + gstAmount
      };
    };

    const updateCartItemQuantity = (index, newQuantity) => {
      if (newQuantity <= 0) {
        removeFromCart(index);
        return;
      }
      const newCart = [...cart];
      newCart[index].quantity = newQuantity;
      newCart[index] = calculateLineItem(newCart[index]);
      setCart(newCart);
    };

    const removeFromCart = (index) => {
      setCart(cart.filter((_, i) => i !== index));
    };

    const clearCart = () => {
      setCart([]);
      setCustomer(null);
      setDiscount(0);
      setAmountReceived('');
      setPaymentMode('cash');
    };

    // Generate invoice number
    const generateInvoiceNo = () => {
      const prefix = company?.invoice_prefix || 'INV';
      const counter = company?.invoice_counter || 1;
      const year = format(new Date(), 'yy');
      return `${prefix}/${year}/${String(counter).padStart(5, '0')}`;
    };

    // Handle payment
    const handlePayment = () => {
      if (cart.length === 0) return;
      setAmountReceived(String(totals.grandTotal));
      setShowPaymentDialog(true);
    };

  const processPayment = async () => {
    const orderPayload = {
      order_date: new Date().toISOString().split("T")[0],
      client_name: customer?.name || "Walk-in Customer",
      client_contact: customer?.phone || "",
      sub_total: totals.subtotal,
      vat: totals.cgstTotal + totals.sgstTotal,
      total_amount: totals.taxableAmount + totals.cgstTotal + totals.sgstTotal,
      discount: discount,
      grand_total: totals.grandTotal,
      paid: amountReceived,
      due: totals.grandTotal - amountReceived,
      payment_type: paymentMode,
      payment_status: 1,
      payment_place: 1,
      order_status: 1
    };

    const orderRes = await fetch("http://localhost:8000/api/orders/create.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderPayload)
    });

    const order = await orderRes.json();

    await fetch("http://localhost:8000/api/order_items/create.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        order_id: order.order_id,
        items: cart
      })
    });

    clearCart();
    setShowPaymentDialog(false);
  };


    // Keyboard shortcuts
    useEffect(() => {
      const handleKeyDown = (e) => {
        if (e.key === 'F1') {
          e.preventDefault();
          clearCart();
        } else if (e.key === 'F2') {
          e.preventDefault();
          document.getElementById('item-search')?.focus();
        } else if (e.key === 'F3') {
          e.preventDefault();
          setShowCustomerSearch(true);
        } else if (e.key === 'F5') {
          e.preventDefault();
          setPaymentMode('cash');
        } else if (e.key === 'F6') {
          e.preventDefault();
          setPaymentMode('card');
        } else if (e.key === 'F7') {
          e.preventDefault();
          setPaymentMode('upi');
        } else if (e.key === 'F10') {
          e.preventDefault();
          handlePayment();
        } else if (e.key === 'F12') {
          e.preventDefault();
          clearCart();
        }
      };
      
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, [cart]);

    // Filter items based on search
  const filteredItems = items.filter(item => 
    !searchQuery || 
    item.product_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.hsn?.includes(searchQuery)
  );


    // Filter customers
const filteredCustomers = customers.filter(c =>
  !customerSearchQuery ||
  c.name?.toLowerCase().includes(customerSearchQuery.toLowerCase()) ||
  c.phone?.includes(customerSearchQuery)
);


    const formatCurrency = (amount) => {
      return new Intl.NumberFormat('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(amount || 0);
    };

    return (
      <div className="min-h-screen flex flex-col lg:flex-row gap-4">

        {/* Left Panel - Items */}
        <div className="flex-1 flex flex-col">
          {/* Search Bar */}
          <Card className="border-0 shadow-[0_6px_18px_rgba(15,23,36,0.06)] mb-4">
            <CardContent className="p-4">
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="item-search"
                    placeholder="Search items or scan barcode... (F2)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 h-12 text-lg bg-[#F7F9FA] border-0 focus:ring-2 focus:ring-emerald-500"
                    autoFocus
                  />
                  <Barcode className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                </div>
                <Button
                  variant="outline"
                  className="h-12 px-4 border-gray-200"
                  onClick={() => setShowCustomerSearch(true)}
                >
                  <User className="w-5 h-5 mr-2" />
                  {customer ? customer.name : 'Select Customer (F3)'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Items Grid */}
          <Card className="flex-1 border-0 shadow-[0_6px_18px_rgba(15,23,36,0.06)] overflow-hidden">
            <CardContent className="p-4 h-full overflow-y-auto">
              {loadingItems ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : filteredItems.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {filteredItems.map(item => (
    <button
      key={`product-${item.product_id || Math.random()}`}      onClick={() => addToCart(item)}

                      className="p-4 rounded-xl bg-[#F7F9FA] hover:bg-emerald-50 hover:border-emerald-300 border border-transparent transition-all text-left group"
                    >
                      <p className="font-medium truncate">
  {item.product_name || "Unnamed Product"}
</p>

<p className="text-xs text-gray-400 mt-1">
  HSN: {item.hsn || "—"}
</p>

<div className="flex items-center justify-between mt-2">
 <p className="font-bold text-emerald-600">
  ₹{Number(item.rate || 0).toFixed(2)}
</p>


<Badge>
  {Number(item.quantity || 0)} PCS
</Badge>

</div>

                    </button>
                  ))}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No items found</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Panel - Cart */}
        <div className="w-full lg:w-96 flex flex-col">
          {/* Cart Header */}
          <Card className="border-0 shadow-[0_6px_18px_rgba(15,23,36,0.06)] mb-4">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-emerald-600" />
                  <span className="font-semibold text-[#0F1724]">Current Sale</span>
                  <Badge className="bg-emerald-100 text-emerald-700">{cart.length} items</Badge>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Clock className="w-4 h-4" />
                  {format(new Date(), 'HH:mm')}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cart Items */}
          <Card className="flex-1 border-0 shadow-[0_6px_18px_rgba(15,23,36,0.06)] overflow-y-auto mb-4">
            <CardContent className="p-4 h-full overflow-y-auto">
              {cart.length > 0 ? (
                <div className="space-y-2">
                  {cart.map((item, index) => (
                    <POSCartItem
                      key={item.item_id}
                      item={item}
                      onQuantityChange={(qty) => updateCartItemQuantity(index, qty)}
                      onRemove={() => removeFromCart(index)}
                    />
                  ))}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Cart is empty</p>
                    <p className="text-sm">Search or click items to add</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Totals & Payment */}
          <Card className="border-0 shadow-[0_6px_18px_rgba(15,23,36,0.06)]">
            <CardContent className="p-4 space-y-3">
              <div className="flex gap-2 items-center mb-3">
    <Input
      type="number"
      placeholder="Discount %"
      value={discount}
      onChange={(e) => setDiscount(Number(e.target.value) || 0)}
      className="w-28"
    />
    <Button variant="outline">
      Apply
    </Button>
  </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Subtotal</span>
                  <span>₹{formatCurrency(totals.subtotal)}</span>
                </div>
                {totals.totalDiscount > 0 && (
                  <div className="flex justify-between text-red-500">
                    <span>Discount</span>
                    <span>-₹{formatCurrency(totals.totalDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">CGST</span>
                  <span>₹{formatCurrency(totals.cgstTotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">SGST</span>
                  <span>₹{formatCurrency(totals.sgstTotal)}</span>
                </div>
                <div className="flex justify-between text-gray-400 text-xs">
                  <span>Round Off</span>
                  <span>₹{formatCurrency(totals.roundOff)}</span>
                </div>
              </div>
              
              <div className="border-t pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-[#0F1724]">Total</span>
                  <span className="text-2xl font-bold bg-gradient-to-r from-emerald-500 to-green-600 bg-clip-text text-transparent">
                    ₹{formatCurrency(totals.grandTotal)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={clearCart}
                  disabled={cart.length === 0}
                  className="border-gray-200"
                >
                  <X className="w-4 h-4 mr-2" />
                  Clear (F12)
                </Button>
                <Button
                  onClick={handlePayment}
                  disabled={cart.length === 0 || createInvoiceMutation.isPending}
                  className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-lg shadow-emerald-500/20"
                >
                  <Receipt className="w-4 h-4 mr-2" />
                  Pay (F10)
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Customer Search Dialog */}
        <Dialog open={showCustomerSearch} onOpenChange={setShowCustomerSearch}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Select Customer</DialogTitle>
            </DialogHeader>
            {loadingCustomers && (
  <p className="text-center text-gray-400">Loading customers...</p>
)}

            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search by name or phone..."
                  value={customerSearchQuery}
                  onChange={(e) => setCustomerSearchQuery(e.target.value)}
                  className="pl-10"
                  autoFocus
                />
              </div>
              <div className="max-h-64 overflow-y-auto space-y-2">
                <button
                  onClick={() => { setCustomer(null); setShowCustomerSearch(false); }}
                  className="w-full p-3 rounded-lg bg-gray-50 hover:bg-gray-100 text-left transition-colors"
                >
                  <p className="font-medium">Walk-in Customer</p>
                  <p className="text-sm text-gray-500">No customer selected</p>
                </button>
                {filteredCustomers.map(c => (
  <button
    key={c.id}
    onClick={() => { setCustomer(c); setShowCustomerSearch(false); }}

                    className="w-full p-3 rounded-lg bg-gray-50 hover:bg-emerald-50 hover:border-emerald-200 border border-transparent text-left transition-colors"
                  >
                    <p className="font-medium text-[#0F1724]">{c.name}</p>
                    <p className="text-sm text-gray-500">{c.phone} • {c.city}</p>
                  </button>
                ))}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Payment Dialog */}
        <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Complete Payment</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="text-center p-4 bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl">
                <p className="text-sm text-gray-500">Amount Due</p>
                <p className="text-4xl font-bold bg-gradient-to-r from-emerald-500 to-green-600 bg-clip-text text-transparent">
                  ₹{formatCurrency(totals.grandTotal)}
                </p>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {[
                  { key: 'cash', icon: Banknote, label: 'Cash' },
                  { key: 'card', icon: CreditCard, label: 'Card' },
                  { key: 'upi', icon: Smartphone, label: 'UPI' },
                  { key: 'credit', icon: Clock, label: 'Credit' },
                ].map(mode => (
                  <Button
                    key={mode.key}
                    variant={paymentMode === mode.key ? "default" : "outline"}
                    onClick={() => setPaymentMode(mode.key)}
                    className={`flex flex-col h-auto py-3 ${
                      paymentMode === mode.key 
                        ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white border-0' 
                        : 'border-gray-200'
                    }`}
                  >
                    <mode.icon className="w-5 h-5 mb-1" />
                    <span className="text-xs">{mode.label}</span>
                  </Button>
                ))}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Amount Received</label>
                <Input
                  type="number"
                  value={amountReceived}
                  onChange={(e) => setAmountReceived(e.target.value)}
                  className="mt-1.5 text-xl font-semibold text-center"
                  autoFocus
                />
                {parseFloat(amountReceived) > totals.grandTotal && (
                  <p className="text-sm text-emerald-600 mt-2 text-center">
                    Change: ₹{formatCurrency(parseFloat(amountReceived) - totals.grandTotal)}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[totals.grandTotal, Math.ceil(totals.grandTotal / 100) * 100, Math.ceil(totals.grandTotal / 500) * 500].map(amount => (
                  <Button
                    key={amount}
                    variant="outline"
                    onClick={() => setAmountReceived(String(amount))}
                    className="border-gray-200"
                  >
                    ₹{amount}
                  </Button>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={processPayment}
                disabled={createInvoiceMutation.isPending}
                className="bg-gradient-to-r from-emerald-500 to-green-600"
              >
                {createInvoiceMutation.isPending ? 'Processing...' : 'Complete Sale'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }