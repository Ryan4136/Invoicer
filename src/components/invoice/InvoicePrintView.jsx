import React from "react";
import { format } from "date-fns";

export default function InvoicePrintView({ invoice, company, onClose }) {

const handlePrint = () => {

  if (!invoice?.order_id) {
    alert("Invoice ID missing");
    return;
  }

  const url = `http://localhost:8000/api/invoice/print.php?orderId=${invoice.order_id}`

  const printWindow = window.open(url, "_blank")

  printWindow.focus()

}

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount || 0);
  };

  const numberToWords = (num) => {
    const ones = [
      "",
      "One","Two","Three","Four","Five","Six","Seven","Eight","Nine",
      "Ten","Eleven","Twelve","Thirteen","Fourteen","Fifteen",
      "Sixteen","Seventeen","Eighteen","Nineteen"
    ];

    const tens = [
      "",
      "",
      "Twenty","Thirty","Forty","Fifty",
      "Sixty","Seventy","Eighty","Ninety"
    ];

    if (num === 0) return "Zero";

    if (num < 20) return ones[num];

    if (num < 100)
      return tens[Math.floor(num / 10)] +
        (num % 10 ? " " + ones[num % 10] : "");

    if (num < 1000)
      return (
        ones[Math.floor(num / 100)] +
        " Hundred" +
        (num % 100 ? " " + numberToWords(num % 100) : "")
      );

    if (num < 100000)
      return (
        numberToWords(Math.floor(num / 1000)) +
        " Thousand" +
        (num % 1000 ? " " + numberToWords(num % 1000) : "")
      );

    if (num < 10000000)
      return (
        numberToWords(Math.floor(num / 100000)) +
        " Lakh" +
        (num % 100000 ? " " + numberToWords(num % 100000) : "")
      );

    return (
      numberToWords(Math.floor(num / 10000000)) +
      " Crore" +
      (num % 10000000 ? " " + numberToWords(num % 10000000) : "")
    );
  };

  const invoiceDate =
    invoice?.invoice_date || invoice?.order_date
      ? format(
          new Date(invoice.invoice_date || invoice.order_date),
          "dd/MM/yyyy"
        )
      : "-";

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">

      <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">

        {/* Controls */}
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center print:hidden">
          <h2 className="font-semibold">Invoice Preview</h2>

          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-emerald-500 text-white rounded-lg"
            >
              Print Invoice
            </button>

            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 rounded-lg"
            >
              Close
            </button>
          </div>
        </div>

        {/* Invoice */}
        <div id="invoice-print" className="invoice-wrapper p-8">

          {/* Header */}
          <div className="header">
            <div>
              <div className="company">
                {company?.name || "Company Name"}
              </div>

              <div>
                {company?.address}
              </div>

              <div>
                GSTIN: {company?.gstin || "-"}
              </div>
            </div>

            <div className="right">
              <h2>TAX INVOICE</h2>
              <div>Invoice No: {invoice.invoice_no}</div>
              <div>Date: {invoiceDate}</div>
            </div>
          </div>

          {/* Meta */}
          <table>
            <thead>
              <tr>
                <th>Invoice No</th>
                <th>Date</th>
                <th>Customer</th>
                <th>GSTIN</th>
              </tr>
            </thead>

            <tbody>
              <tr>
                <td>{invoice.invoice_no}</td>
                <td>{invoiceDate}</td>
                <td>{invoice.customer_name}</td>
                <td>{invoice.customer_gstin || "-"}</td>
              </tr>
            </tbody>
          </table>

          {/* Bill Ship */}
          <div className="bill-ship">
            <div className="bill">
              <strong>Bill To</strong>
              <br />
              {invoice.customer_name}
              <br />
              {invoice.customer_address}
            </div>

            <div className="ship">
              <strong>Place of Supply</strong>
              <br />
              {invoice.place_of_supply || "-"}
            </div>
          </div>

          {/* Items */}
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Description</th>
                <th>HSN</th>
                <th>Qty</th>
                <th>Rate</th>
                <th>GST%</th>
                <th>Tax</th>
                <th>Total</th>
              </tr>
            </thead>

            <tbody>
              {(invoice.items || []).map((item, i) => {

                const tax =
                  (item.cgst_amount || 0) +
                  (item.sgst_amount || 0) +
                  (item.igst_amount || 0);

                return (
                  <tr key={i}>
                    <td className="center">{i + 1}</td>

                    <td>{item.item_name}</td>

                    <td className="center">{item.hsn_code}</td>

                    <td className="right">
                      {item.quantity} {item.unit}
                    </td>

                    <td className="right">
                      ₹{formatCurrency(item.rate)}
                    </td>

                    <td className="center">
                      {item.gst_rate}%
                    </td>

                    <td className="right">
                      ₹{formatCurrency(tax)}
                    </td>

                    <td className="right">
                      ₹{formatCurrency(item.total_amount)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Totals */}
          <table className="totals">
            <tbody>

              <tr>
                <td>Subtotal</td>
                <td className="right">
                  ₹{formatCurrency(invoice.subtotal)}
                </td>
              </tr>

              <tr>
                <td>Taxable</td>
                <td className="right">
                  ₹{formatCurrency(invoice.taxable_amount)}
                </td>
              </tr>

              <tr>
                <td>CGST</td>
                <td className="right">
                  ₹{formatCurrency(invoice.cgst_total)}
                </td>
              </tr>

              <tr>
                <td>SGST</td>
                <td className="right">
                  ₹{formatCurrency(invoice.sgst_total)}
                </td>
              </tr>

              <tr>
                <td><strong>Grand Total</strong></td>
                <td className="right">
                  <strong>
                    ₹{formatCurrency(invoice.grand_total)}
                  </strong>
                </td>
              </tr>

            </tbody>
          </table>

          {/* Amount Words */}
          <div className="amount-words">
            Amount in words:{" "}
            {numberToWords(Math.round(invoice.grand_total || 0))} Rupees Only
          </div>

          {/* Bank */}
          {company?.bank_name && (
            <div className="bank">
              <strong>Bank Details</strong>
              <br />
              Bank: {company.bank_name}
              <br />
              A/C: {company.bank_account}
              <br />
              IFSC: {company.bank_ifsc}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}