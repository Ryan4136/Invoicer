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
if (!empty($gstin) && strlen(trim($gstin)) == 15) {

    $b2b[] = $sale;
}

    // B2C LARGE
    else if ($grand_total > 250000 && $is_igst == 1) {
        $b2c_large[] = $sale;
    }

    // B2C SMALL
    else {
        $b2c_small[] = $sale;
    }
}

// =========================
// GSTR-3B CALCULATIONS
// =========================

$outward_taxable = 0;
$output_tax = 0;

foreach ($sales as $sale) {

    $outward_taxable += (float)$sale['taxable_amount'];

    $output_tax +=
        (float)$sale['cgst_total'] +
        (float)$sale['sgst_total'] +
        (float)$sale['igst_total'];
}

// =========================

$inward_taxable = 0;
$input_tax = 0;

foreach ($purchases as $purchase) {

    $inward_taxable += (float)$purchase['taxable_amount'];

$input_tax += (float)$purchase['vat'];
}

// =========================

$net_payable = $output_tax - $input_tax;

// =========================
// HSN SUMMARY
// =========================

$hsnSummary = [];

$hsnSql = "
SELECT
    gst_rate,
    SUM(sub_total) as taxable_value,
    SUM(cgst_total) as cgst,
    SUM(sgst_total) as sgst,
    SUM(igst_total) as igst,
    COUNT(*) as invoices

FROM orders

WHERE DATE(order_date) BETWEEN ? AND ?

GROUP BY gst_rate
";

$stmtHsn = $conn->prepare($hsnSql);

$stmtHsn->bind_param("ss", $start_date, $end_date);

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

        "interstate_igst" => 0,

        "intrastate_taxable" => $outward_taxable,

        "intrastate_cgst" => $output_tax / 2,

        "intrastate_sgst" => $output_tax / 2
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