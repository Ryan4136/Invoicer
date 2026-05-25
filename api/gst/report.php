<?php

require_once '../cors.php';
require_once '../db_connect.php';

header("Content-Type: application/json");

// =========================
// GET MONTH
// =========================

$month = $_GET['month'] ?? date('Y-m');

$start_date = $month . '-01';
$end_date = date("Y-m-t", strtotime($start_date));

// =========================
// SALES DATA
// =========================

$salesSql = "
SELECT *
FROM orders
WHERE DATE(order_date) BETWEEN ? AND ?
";

$stmtSales = $conn->prepare($salesSql);

$stmtSales->bind_param("ss", $start_date, $end_date);

$stmtSales->execute();

$salesResult = $stmtSales->get_result();

$sales = [];

while ($row = $salesResult->fetch_assoc()) {
    $sales[] = $row;
}

// =========================
// PURCHASE DATA
// =========================

$purchaseSql = "
SELECT *
FROM purchases
WHERE DATE(purchase_date) BETWEEN ? AND ?
";

$stmtPurchase = $conn->prepare($purchaseSql);

$stmtPurchase->bind_param("ss", $start_date, $end_date);

$stmtPurchase->execute();

$purchaseResult = $stmtPurchase->get_result();

$purchases = [];

while ($row = $purchaseResult->fetch_assoc()) {
    $purchases[] = $row;
}

// =========================
// GSTR-1
// =========================

$b2b = [];
$b2c_large = [];
$b2c_small = [];

foreach ($sales as $sale) {

    $gstin = $sale['customer_gstin'] ?? '';
    $is_igst = (int)($sale['is_igst'] ?? 0);
    $grand_total = (float)$sale['grand_total'];

    // B2B
$gstin = trim($sale['clgstin'] ?? '');

if (strlen($gstin) === 15) {

    $b2b[] = $sale;
}

    // B2C LARGE
else if (

    strlen($gstin) !== 15 &&

    $grand_total > 250000 &&

    $is_igst == 1

) {

    $b2c_large[] = $sale;
}

    // B2C SMALL
    else {
        $b2c_small[] = $sale;
    }
}
$total_cgst = 0;
$total_sgst = 0;
$total_igst = 0;    
// =========================
// GSTR-3B CALCULATIONS
// =========================

$outward_taxable = 0;
$output_tax = 0;

foreach ($sales as $sale) {

    $outward_taxable += (float)$sale['taxable_amount'];

    $tax =
    (float)$sale['cgst_total'] +
    (float)$sale['sgst_total'] +
    (float)$sale['igst_total'];

if ($tax <= 0) {
    $tax = (float)$sale['vat'];
}

$output_tax += $tax;
$cgst = (float)$sale['cgst_total'];

$sgst = (float)$sale['sgst_total'];

$igst = (float)$sale['igst_total'];

if (($cgst + $sgst + $igst) <= 0 && (float)$sale['vat'] > 0) {

    if ((int)$sale['is_igst'] === 1) {

        $igst = (float)$sale['vat'];

    } else {

        $cgst = (float)$sale['vat'] / 2;

        $sgst = (float)$sale['vat'] / 2;
    }
}

$total_cgst += $cgst;

$total_sgst += $sgst;

$total_igst += $igst;
}

// =========================
$input_cgst = 0;
$input_sgst = 0;
$input_igst = 0;
$inward_taxable = 0;
$input_tax = 0;

foreach ($purchases as $purchase) {

    $inward_taxable += (float)$purchase['taxable_amount'];

$input_tax += (float)$purchase['vat'];
$pcgst = (float)($purchase['cgst_total'] ?? 0);

$psgst = (float)($purchase['sgst_total'] ?? 0);

$pigst = (float)($purchase['igst_total'] ?? 0);

if (($pcgst + $psgst + $pigst) <= 0 && (float)$purchase['vat'] > 0) {

    $pcgst = (float)$purchase['vat'] / 2;

    $psgst = (float)$purchase['vat'] / 2;
}

$input_cgst += $pcgst;

$input_sgst += $psgst;

$input_igst += $pigst;
}

// =========================

$net_payable = $output_tax - $input_tax;

$excess_itc = 0;

if ($net_payable < 0) {

    $excess_itc = abs($net_payable);

    $net_payable = 0;
}

// =========================
// HSN SUMMARY
// =========================

$hsnSummary = [];

$hsnSql = "

SELECT

    oi.hsn_code,

    oi.product_name as description,

    'PCS' as uqc,

    SUM(oi.quantity) as total_quantity,

    oi.gst_rate,

    SUM(oi.quantity * oi.rate) as taxable_value,

SUM(
    CASE
        WHEN o.is_igst = 0
        THEN (oi.quantity * oi.rate) * (oi.gst_rate / 2) / 100
        ELSE 0
    END
) as cgst,

SUM(
    CASE
        WHEN o.is_igst = 0
        THEN (oi.quantity * oi.rate) * (oi.gst_rate / 2) / 100
        ELSE 0
    END
) as sgst,

    SUM(
        CASE
            WHEN o.is_igst = 1
            THEN (oi.quantity * oi.rate) * oi.gst_rate / 100
            ELSE 0
        END
    ) as igst,

    COUNT(DISTINCT oi.order_id) as invoices

FROM order_item oi

INNER JOIN orders o
ON oi.order_id = o.order_id

WHERE DATE(o.order_date) BETWEEN ? AND ?

GROUP BY
    oi.hsn_code,
    oi.product_name,
    oi.gst_rate

ORDER BY oi.hsn_code ASC

";

$stmtHsn = $conn->prepare($hsnSql);

$stmtHsn->bind_param(
    "ss",
    $start_date,
    $end_date
);

$stmtHsn->execute();

$hsnResult = $stmtHsn->get_result();

while ($row = $hsnResult->fetch_assoc()) {
    $hsnSummary[] = $row;
}

// =========================
// RESPONSE
// =========================

echo json_encode([

    "summary" => [

        "outward_taxable" => $outward_taxable,

        "output_tax" => $output_tax,

        "inward_taxable" => $inward_taxable,

        "input_tax" => $input_tax,

        "net_payable" => $net_payable,

        // NEW
"interstate_taxable" => 0,

"interstate_igst" => $total_igst,

"intrastate_taxable" => $outward_taxable,

"intrastate_cgst" => $total_cgst,

"intrastate_sgst" => $total_sgst,

"inward_cgst" => $input_cgst,

"inward_sgst" => $input_sgst,

"inward_igst" => $input_igst,

"excess_itc" => $excess_itc,

  
    ],

    // NEW
    "sales" => $sales,

    // NEW
    "purchases" => $purchases,

    "gstr1" => [

        "b2b" => $b2b,

        "b2c_large" => $b2c_large,

        "b2c_small" => $b2c_small
    ],

    "credit_notes" => [],

    "debit_notes" => [],

    "hsn_summary" => $hsnSummary
]);