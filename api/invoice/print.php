<?php

require_once __DIR__ . "/../cors.php";
require_once __DIR__ . "/../db_connect.php";

$conn = new mysqli("localhost","root","","store");

$baseUrl = "http://localhost:8000/";

$companyQuery = $conn->query("
SELECT * FROM company_settings 
ORDER BY company_id ASC 
LIMIT 1
");

if(!$companyQuery || $companyQuery->num_rows == 0){
    echo "Company settings not found";
    exit;
}

$company = $companyQuery->fetch_assoc();

$orderId = $_GET['orderId'] ?? $_POST['orderId'] ?? 0;
$orderId = (int)$orderId;

if($orderId <= 0){
 echo "Invalid order id";
 exit;
}

$sql = $conn->prepare("
SELECT order_date,client_name,client_contact,sub_total,vat,
total_amount,grand_total,paid,due,payment_place,
gst_rate,clgstin,payment_type,order_id
FROM orders
WHERE order_id = ?
LIMIT 1
");

$sql->bind_param("i",$orderId);
$sql->execute();

$orderResult = $sql->get_result();

if(!$orderResult || $orderResult->num_rows===0){
 echo "Order not found";
 exit;
}

$orderData = $orderResult->fetch_assoc();

$orderDate = $orderData['order_date'];
$clientName = $orderData['client_name'];
$clientContact = $orderData['client_contact'];
$gstn_rate = floatval($orderData['gst_rate']);
$clgstin = $orderData['clgstin'];
$payment_place = intval($orderData['payment_place']);
$order_id = intval($orderData['order_id']);
$paid = floatval($orderData['paid']);
$due = floatval($orderData['due']);
$payment_type = $orderData['payment_type'];

$orderItemSql = "
SELECT oi.product_id,oi.rate,oi.net,oi.gross,oi.quantity,oi.total,
p.product_name,p.hsn,p.mrp
FROM order_item oi
LEFT JOIN product p ON oi.product_id = p.product_id
WHERE oi.order_id = ?
ORDER BY oi.order_item_id ASC
";

$itemStmt = $conn->prepare($orderItemSql);
$itemStmt->bind_param("i",$orderId);
$itemStmt->execute();
$orderItemResult = $itemStmt->get_result();

function convertNumberToWords($number) {
    $hyphen      = '-';
    $conjunction = ' and ';
    $separator   = ', ';
    $negative    = 'negative ';
    $decimal     = ' point ';

    $dictionary = [
        0 => 'ZERO',1 => 'ONE',2 => 'TWO',3 => 'THREE',4 => 'FOUR',5 => 'FIVE',6 => 'SIX',7 => 'SEVEN',8 => 'EIGHT',9 => 'NINE',
        10 => 'TEN',11 => 'ELEVEN',12 => 'TWELVE',13 => 'THIRTEEN',14 => 'FOURTEEN',15 => 'FIFTEEN',16 => 'SIXTEEN',17 => 'SEVENTEEN',18 => 'EIGHTEEN',19 => 'NINETEEN',
        20 => 'TWENTY',30 => 'THIRTY',40 => 'FORTY',50 => 'FIFTY',60 => 'SIXTY',70 => 'SEVENTY',80 => 'EIGHTY',90 => 'NINETY',
    ];

    $numberString = (string) $number;

    if ($number < 0) {
        return $negative . convertNumberToWords(abs($number));
    }

    if (strpos($numberString, '.') !== false) {
        list($integerPart, $decimalPart) = explode('.', $numberString);
    } else {
        $integerPart = $numberString;
        $decimalPart = null;
    }

    $words = convertIntegerToWords((int)$integerPart, $dictionary, $hyphen, $conjunction, $separator);

    if ($decimalPart !== null) {
        $decimalWords = '';
        foreach (str_split($decimalPart) as $digit) {
            $decimalWords .= $dictionary[(int)$digit] . ' ';
        }
        $decimalWords = trim($decimalWords);
        $words .= $decimal . ' ' . $decimalWords;
    }

    return $words;
}

function convertIntegerToWords($number, $dictionary, $hyphen, $conjunction, $separator) {
    if ($number < 0) {
        return 'negative ' . convertIntegerToWords(abs($number), $dictionary, $hyphen, $conjunction, $separator);
    }
    if ($number < 21) {
        return $dictionary[$number];
    }
    if ($number < 100) {
        $tens = (int)($number / 10) * 10;
        $units = $number % 10;
        return $dictionary[$tens] . ($units ? $hyphen . $dictionary[$units] : '');
    }
    if ($number < 1000) {
        $hundreds = (int)($number / 100);
        $remainder = $number % 100;
        return $dictionary[$hundreds] . ' HUNDRED' . ($remainder ? $conjunction . convertIntegerToWords($remainder, $dictionary, $hyphen, $conjunction, $separator) : '');
    }
    if ($number < 100000) {
        $thousands = (int)($number / 1000);
        $remainder = $number % 1000;
        return convertIntegerToWords($thousands, $dictionary, $hyphen, $conjunction, $separator) . ' THOUSAND' . ($remainder ? $separator . convertIntegerToWords($remainder, $dictionary, $hyphen, $conjunction, $separator) : '');
    }
    if ($number < 10000000) {
        $lakhs = (int)($number / 100000);
        $remainder = $number % 100000;
        return convertIntegerToWords($lakhs, $dictionary, $hyphen, $conjunction, $separator) . ' LAKH' . ($remainder ? $separator . convertIntegerToWords($remainder, $dictionary, $hyphen, $conjunction, $separator) : '');
    }
    if ($number < 1000000000) {
        $crores = (int)($number / 10000000);
        $remainder = $number % 10000000;
        return convertIntegerToWords($crores, $dictionary, $hyphen, $conjunction, $separator) . ' CRORE' . ($remainder ? $separator . convertIntegerToWords($remainder, $dictionary, $hyphen, $conjunction, $separator) : '');
    }
    return '';
}

$style = <<<'CSS'
<style>
.wm-inner {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%) rotate(-18deg);
  opacity: 0.08;
  pointer-events: none;
  width: 56%;
  max-width: 680px;
  z-index: 0;
  text-align: center;
}
.wm-inner img { width:100%; height:auto; display:block; }

.copy { position: relative; overflow: hidden; background: #fff; }
.invoice-wrapper { position: relative; z-index: 2; }
.watermark { display:none !important; }

@media print {
  @page {
    size: auto;
    margin: 4mm;
  }
}

html, body { margin:0; padding:0; -webkit-print-color-adjust:exact; }
body { font-family: Arial, Helvetica, sans-serif; font-size: 9px; color: #000; position:relative; }

.sheet { width:100%; display:flex; gap:6px; box-sizing:border-box; padding:4px; }
.copy { width:100%; box-sizing:border-box; page-break-inside: avoid; background: transparent; padding:5px; }

.invoice-header .brand { display:flex; align-items:center; gap:8px; }
.invoice-header .brand .company { font-size:11px; margin-top:2px; font-weight:700; }
.invoice-header .addr { font-size:9px; margin-top:2px; line-height:1.05; }

:root{
  --line-color: #000000;
  --line-width: 0.9px;
  --header-bg: #f0f8f0;
}
.meta-table, .items-table, .tax-breakup, .totals-summary { width:100%; border-collapse: collapse; font-size:9px; }
.meta-table th, .meta-table td, .items-table th, .items-table td, .tax-breakup th, .tax-breakup td, .totals-summary td {
  border: var(--line-width) solid var(--line-color);
  padding:3px 6px;
  vertical-align:middle;
  background: transparent !important;
  font-weight:400;
  color: #000;
}
.meta-table th, .items-table th, .tax-breakup th, .totals-summary th {
  font-weight:700;
  font-size:9px;
  background: var(--header-bg) !important;
  border: var(--line-width) solid var(--line-color);
  padding:4px 6px;
}
.items-table tbody tr { height: 15px; }

.bill-ship { display:flex; gap:6px; margin-top:6px; margin-bottom:6px; }
.bill, .ship { border: var(--line-width) solid var(--line-color); padding:6px; flex:1; font-size:9px; line-height:1.05; background: transparent !important; }

.amount-words {
  margin-top: 6px;
  font-size: 10px;
  font-weight: 700;
  line-height: 1.05;
  text-transform: uppercase;
  padding: 6px 8px;
  background: transparent !important;
  word-wrap: break-word;
  hyphens: auto;
}

.totals-box {
  width: 100%;
}

.totals-summary { border-collapse:collapse; font-size:10px; width:100%; }
.totals-summary th, .totals-summary td { padding:6px 8px; text-align:center; }

.bank-details { border: var(--line-width) solid var(--line-color); padding:6px; font-size:9px; line-height:1.05; margin-top:6px; background: transparent !important; }
.bottom-row { display:flex; gap:6px; margin-top:6px; }
.terms { flex:1; border: var(--line-width) solid var(--line-color); padding:6px; font-size:9px; line-height:1.05; background: transparent !important; }
.sign { width:140px; text-align:center; border: var(--line-width) solid var(--line-color); padding:6px; font-size:9px; background: transparent !important; }

.invoice-logo { width:64px; height:auto; object-fit:contain; display:block; }

.right { text-align:right; }
.center { text-align:center; }

@media print {
  .sheet { gap:5mm; }
  .copy { page-break-inside: avoid; }
  body { -webkit-print-color-adjust:exact; }
}
</style>
CSS;

$content = "
<div class='invoice-wrapper'>
  <div class='invoice-header'>
    <div class='brand'>
      <img src='" . htmlspecialchars($baseUrl . ($company['logo_path'] ?: 'assets/logo.png')) . "' alt='Logo' class='invoice-logo' />
      <div>
        <div class='company'>" . htmlspecialchars($company['company_name']) . "</div>
        <div class='addr'>
          " . nl2br(htmlspecialchars($company['address'])) . "<br/>
          GSTIN: " . htmlspecialchars($company['gstin']) . "<br/>
          Contact: " . htmlspecialchars($company['phone']) . "
        </div>
      </div>
    </div>
  </div>

  <table class='meta-table' style='margin-top:6px;'>
    <thead>
      <tr>
        <th style='width:18%'>Invoice Number</th>
        <th style='width:18%'>Invoice Date</th>
        <th style='width:34%'>Customer</th>
        <th style='width:30%'>Customer Number</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>INV-" . htmlspecialchars($order_id) . "</td>
        <td>" . date('d/m/Y', strtotime($orderDate)) . "</td>
        <td>" . htmlspecialchars($clientName) . "</td>
        <td>" . htmlspecialchars($clientContact) . "</td>
      </tr>
    </tbody>
  </table>

  <div class='bill-ship'>
    <div class='bill'><strong>BILL TO:</strong><br>" . htmlspecialchars($clientName) . "<br/>GSTIN - " . htmlspecialchars($clgstin) . "</div>
    <div class='ship'><strong>SHIP TO:</strong><br/>" . htmlspecialchars($clientName) . "</div>
  </div>

  <table class='items-table'>
    <thead>
      <tr>
        <th style='width:4%'>S.No</th>
        <th style='width:8%'>HSN</th>
        <th style='width:34%'>Description</th>
        <th style='width:8%'>MRP</th>
        <th style='width:6%'>Alt Qty</th>
        <th style='width:6%'>Qty</th>
        <th style='width:8%'>Price</th>
        <th style='width:6%'>GST%</th>
        <th style='width:10%'>Amount</th>
      </tr>
    </thead>
    <tbody>
";

$lineNo = 1;
$calc_subtotal = 0.0;
$calc_total_gst = 0.0;
$calc_grand_total = 0.0;
$lastHsn = '';
$sum_qty = 0;
$sum_mrp = 0;
$itemCount = 0;

if ($orderItemResult && $orderItemResult->num_rows > 0) {
    while ($row = $orderItemResult->fetch_assoc()) {
        $itemCount++;
        $productName = $row['product_name'] ? $row['product_name'] : 'Product ID ' . intval($row['product_id']);
        $hsn = $row['hsn'] ?? '';
        $lastHsn = $hsn ? $hsn : $lastHsn;
        $altQty = $row['net'];
        $qty  = (float)$row['quantity'];
        $rate = (float)$row['rate'];
        $mrp  = isset($row['mrp']) ? (float)$row['mrp'] : 0.00;

        $sum_qty += $qty;
        $sum_mrp += ($mrp * $qty);

        $lineBase = $rate * $qty;
        $lineGst = ($lineBase * $gstn_rate) / 100.0;
        $lineTotal = $lineBase + $lineGst;

        $calc_subtotal += $lineBase;
        $calc_total_gst += $lineGst;
        $calc_grand_total += $lineTotal;

        $content .= "<tr>
            <td class='center'>" . $lineNo . "</td>
            <td class='center'>" . htmlspecialchars($hsn) . "</td>
            <td>" . htmlspecialchars($productName) . "</td>
            <td class='right'>" . number_format($mrp,2) . "</td>
            <td class='center'>" . htmlspecialchars($altQty) . "</td>
            <td class='center'>" . (int)$qty . "</td>
            <td class='right'>" . number_format($rate,2) . "</td>
            <td class='center'>" . number_format($gstn_rate,2) . "%</td>
            <td class='right'>" . number_format($lineTotal,2) . "</td>
        </tr>";

        $lineNo++;
    }
} else {
    $content .= "<tr><td colspan='9' style='text-align:center; padding:6px;'>No items for this order</td></tr>";
}

for ($i = $lineNo; $i <= 15; $i++) {
    $content .= "<tr>
      <td class='center'>{$i}</td>
      <td class='center'>&nbsp;</td>
      <td>&nbsp;</td>
      <td class='right'>&nbsp;</td>
      <td class='center'>&nbsp;</td>
      <td class='center'>&nbsp;</td>
      <td class='right'>&nbsp;</td>
      <td class='center'>&nbsp;</td>
      <td class='right'>&nbsp;</td>
    </tr>";
}

$content .= "</tbody>
<tfoot>
<tr style='font-weight:700; background:#f0f8f0;'>
    <td colspan='3' class='right'>TOTAL</td>
    <td class='right'>" . number_format($sum_mrp,2) . "</td>
    <td></td>
    <td class='center'>" . number_format($sum_qty,0) . "</td>
    <td class='right'>" . number_format($calc_subtotal,2) . "</td>
    <td class='center'>" . number_format($gstn_rate,2) . "%</td>
    <td class='right'>" . number_format($calc_grand_total,2) . "</td>
</tr>
</tfoot>
</table>";

$actualGrandTotal  = $calc_grand_total;
$roundedGrandTotal = round($actualGrandTotal, 0);
$roundOffValue     = $roundedGrandTotal - $actualGrandTotal;
$displayHsn = isset($lastHsn) ? $lastHsn : '';

$totalsHtml = "<table class='tax-breakup totals-summary' style='width:100%; border-collapse:collapse;'>";

if ($payment_place == 2) {
    $totalsHtml .= "
      <thead>
        <tr>
          <th>HSN/SAC</th>
          <th>Taxable Value</th>
          <th>IGST Rate</th>
          <th>IGST Amount</th>
          <th>Total Tax</th>
        </tr>
      </thead>
      <tbody>
      <tr>
        <td class='center'>" . htmlspecialchars($displayHsn) . "</td>
        <td class='right'>" . number_format($calc_subtotal,2) . "</td>
        <td class='center'>" . number_format($gstn_rate,2) . "%</td>
        <td class='right'>" . number_format($calc_total_gst,2) . "</td>
        <td class='right'>" . number_format($calc_total_gst,2) . "</td>
      </tr>
      <tr>
        <td colspan='3' class='right'><strong>Sub Total</strong></td>
        <td colspan='2' class='right'>" . number_format($actualGrandTotal,2) . "</td>
      </tr>
      <tr>
        <td colspan='3' class='right'><strong>Round Off</strong></td>
        <td colspan='2' class='right'>" . number_format($roundOffValue,2) . "</td>
      </tr>
      <tr>
        <td colspan='3' class='right'><strong>Net Payable</strong></td>
        <td colspan='2' class='right'><strong>" . number_format($roundedGrandTotal,2) . "</strong></td>
      </tr>
      </tbody>";
} else {
    $halfRate = $gstn_rate / 2.0;
    $cgstAmt = $calc_total_gst / 2.0;
    $sgstAmt = $calc_total_gst / 2.0;

    $totalsHtml .= "
      <thead>
        <tr>
          <th>HSN/SAC</th>
          <th>Taxable Value</th>
          <th>CGST Rate</th>
          <th>CGST Amount</th>
          <th>SGST Rate</th>
          <th>SGST Amount</th>
          <th>Total Tax</th>
        </tr>
      </thead>
      <tbody>
      <tr>
        <td class='center'>" . htmlspecialchars($displayHsn ?: '---') . "</td>
        <td class='right'>" . number_format($calc_subtotal,2) . "</td>
        <td class='center'>" . number_format($halfRate,2) . "%</td>
        <td class='right'>" . number_format($cgstAmt,2) . "</td>
        <td class='center'>" . number_format($halfRate,2) . "%</td>
        <td class='right'>" . number_format($sgstAmt,2) . "</td>
        <td class='right'>" . number_format($calc_total_gst,2) . "</td>
      </tr>
      <tr style='font-weight:700;'>
        <td colspan='2' class='right'>Sub Total</td>
        <td colspan='2' class='right'>" . number_format($actualGrandTotal, 2) . "</td>
        <td class='right'>Round Off</td>
        <td class='right'>" . number_format($roundOffValue, 2) . "</td>
        <td class='right'>" . number_format($roundedGrandTotal, 2) . "</td>
      </tr>
      </tbody>";
}

$totalsHtml .= "</table>";

$totalRounded = $roundedGrandTotal;
$totalInWords = convertNumberToWords($totalRounded);

$content .= "<div class='totals-box'>" . $totalsHtml . "</div>";

$content .= "<div class='amount-words'>
      Total (in words): 
      <strong><em>" . htmlspecialchars($totalInWords) . " Rupees Only</em></strong>
  </div>";

$content .= "
<div class='bank-details' style='display:flex; flex-wrap:wrap; gap:16px; align-items:center;'>
  <strong>Bank Details:</strong>
  <span>Bank: " . htmlspecialchars($company['bank_name']) . "</span>
  <span>Branch: " . htmlspecialchars($company['bank_branch'] ?? '') . "</span>
  <span>A/c No: " . htmlspecialchars($company['account_number']) . "</span>
  <span>IFSC: " . htmlspecialchars($company['ifsc']) . "</span>
</div>";

$content .= "<div class='bottom-row' style='margin-top:8px;'>
  <div class='terms'>
    <strong>Terms & Conditions</strong><br/>"
    . nl2br(htmlspecialchars($company['terms'])) .
  "</div>

  <div class='sign'>
    <div style='height:36px'>&nbsp;</div>
    <div>For " . htmlspecialchars($company['company_name']) . "</div>
    <div style='margin-top:6px;'>PROPRIETOR</div>
  </div>
</div>
</div>";

$finalHtml = "<!doctype html><html><head>
<meta charset='utf-8'>
<meta name='viewport' content='width=device-width,initial-scale=1'>
<title>Invoice</title>
$style
</head>
<body>";

$logoPath = 'logo.png';
if (file_exists($logoPath)) {
    $wmImgHtml = "<div class='wm-inner'><img src='{$logoPath}' alt='Watermark' /></div>";
} else {
    $wmImgHtml = "";
}

$finalHtml .= "<div class='sheet'>";
$finalHtml .= "<div class='copy'>" . $wmImgHtml . $content . "</div>";
$finalHtml .= "</div>";

$finalHtml .= "
<script>
window.onload=function(){
setTimeout(function(){
window.print();
},600);
}
</script>
";

$finalHtml .= "</body></html>";

echo $finalHtml;

$conn->close();
?>