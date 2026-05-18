<?php

require_once '../../vendor/autoload.php';
require_once '../cors.php';
require_once '../db_connect.php';

use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

// =========================
// GET MONTH
// =========================

$month = $_GET['month'] ?? date('Y-m');

$start_date = $month . '-01';
$end_date = date('Y-m-t', strtotime($start_date));

// =========================
// FETCH SALES
// =========================

$sql = "
SELECT *
FROM orders
WHERE DATE(order_date) BETWEEN ? AND ?
ORDER BY order_date ASC
";

$stmt = $conn->prepare($sql);
$stmt->bind_param("ss", $start_date, $end_date);
$stmt->execute();

$result = $stmt->get_result();

$sales = [];

while ($row = $result->fetch_assoc()) {
    $sales[] = $row;
}

// =========================
// CREATE WORKBOOK
// =========================

$spreadsheet = new Spreadsheet();

// =====================================================
// SHEET 1 — B2B
// =====================================================

$sheet = $spreadsheet->getActiveSheet();

$sheet->setTitle('b2b');

$headers = [

    'GSTIN/UIN of Recipient',
    'Receiver Name',
    'Invoice Number',
    'Invoice Date',
    'Invoice Value',
    'Place Of Supply',
    'Reverse Charge',
    'Invoice Type',
    'Rate',
    'Taxable Value',
    'CGST',
    'SGST',
    'IGST',
    'Cess Amount'
];

$col = 'A';

foreach ($headers as $header) {

    $sheet->setCellValue($col . '1', $header);

    $col++;
}
$sheet->getStyle('A1:N1')->getFont()->setBold(true);

foreach (range('A', 'N') as $col) {

    $sheet->getColumnDimension($col)->setAutoSize(true);
}

$sheet->freezePane('A2');

$sheet->setAutoFilter('A1:N1');

$rowNo = 2;

foreach ($sales as $sale) {

    $gstin = trim($sale['clgstin'] ?? '');

    // ONLY B2B
    if (strlen($gstin) != 15) {
        continue;
    }

    $sheet->setCellValue("A$rowNo", $gstin);
    $sheet->setCellValue("B$rowNo", $sale['client_name']);
    $sheet->setCellValue("C$rowNo", $sale['invoice_no']);
    $sheet->setCellValue("D$rowNo", $sale['order_date']);
    $sheet->setCellValue("E$rowNo", $sale['grand_total']);
    $sheet->setCellValue("F$rowNo", $sale['place_of_supply'] ?? '29-Karnataka');
    $sheet->setCellValue("G$rowNo", 'No');
    $sheet->setCellValue("H$rowNo", 'Regular B2B');
    $sheet->setCellValue("I$rowNo", $sale['gst_rate']);
    $sheet->setCellValue("J$rowNo", $sale['sub_total']);

    $sheet->setCellValue(
        "K$rowNo",
        (float)$sale['cgst_total']
    );

    $sheet->setCellValue(
        "L$rowNo",
        (float)$sale['sgst_total']
    );

    $sheet->setCellValue(
        "M$rowNo",
        (float)$sale['igst_total']
    );

    $sheet->setCellValue(
        "N$rowNo",
        (float)($sale['cess_amount'] ?? 0)
    );

    $rowNo++;
}

// =====================================================
// SHEET 2 — B2CS
// =====================================================

$b2csSheet = $spreadsheet->createSheet();

$b2csSheet->setTitle('b2cs');

$b2csHeaders = [

    'Type',
    'Place Of Supply',
    'Rate',
    'Taxable Value',
    'CGST',
    'SGST',
    'IGST',
    'Cess Amount'
];

$col = 'A';

foreach ($b2csHeaders as $header) {

    $b2csSheet->setCellValue($col . '1', $header);

    $col++;
}

$b2csSheet->getStyle('A1:H1')->getFont()->setBold(true);

foreach (range('A', 'J') as $col) {

    $b2csSheet->getColumnDimension($col)->setAutoSize(true);
}

$b2csSheet->freezePane('A2');

$b2csSheet->setAutoFilter('A1:H1');

$rowNo = 2;

foreach ($sales as $sale) {

    $gstin = trim($sale['clgstin'] ?? '');

    $grand_total = (float)$sale['grand_total'];

    // SKIP B2B
if (strlen(trim($gstin)) === 15) {
    continue;
}

    // SKIP B2CL
    if (
        $grand_total > 250000 &&
        (int)$sale['is_igst'] == 1
    ) {
        continue;
    }

    $b2csSheet->setCellValue("A$rowNo", 'OE');
    $b2csSheet->setCellValue(
        "B$rowNo",
        $sale['place_of_supply'] ?? '29-Karnataka'
    );

    $b2csSheet->setCellValue(
        "C$rowNo",
        $sale['gst_rate']
    );

    $b2csSheet->setCellValue(
        "D$rowNo",
        $sale['sub_total']
    );

    $b2csSheet->setCellValue(
        "E$rowNo",
        (float)$sale['cgst_total']
    );

    $b2csSheet->setCellValue(
        "F$rowNo",
        (float)$sale['sgst_total']
    );

    $b2csSheet->setCellValue(
        "G$rowNo",
        (float)$sale['igst_total']
    );

    $b2csSheet->setCellValue(
        "H$rowNo",
        (float)($sale['cess_amount'] ?? 0)
    );

    $rowNo++;
}

// =====================================================
// SHEET 3 — HSN SUMMARY
// =====================================================

$hsnSheet = $spreadsheet->createSheet();

$hsnSheet->setTitle('hsn');

$hsnHeaders = [

    'HSN Code',

    'Product',

    'GST Rate',

    'Qty',

    'Taxable Value',

    'CGST',

    'SGST',

    'IGST',

    'Total Value',

    'Invoices'
];

$col = 'A';

foreach ($hsnHeaders as $header) {

    $hsnSheet->setCellValue($col . '1', $header);

    $col++;
}

$hsnSheet->getStyle('A1:J1')->getFont()->setBold(true);

foreach (range('A', 'J') as $col) {

    $hsnSheet->getColumnDimension($col)->setAutoSize(true);
}

$hsnSheet->freezePane('A2');

$hsnSheet->setAutoFilter('A1:J1');

$hsnSql = "

SELECT

    hsn_code,

    product_name,

    gst_rate,

    SUM(quantity) as total_qty,

    SUM(taxable_value) as taxable_value,

    SUM(cgst) as cgst,

    SUM(sgst) as sgst,

    SUM(igst) as igst,

    SUM(total) as total_value,

    COUNT(DISTINCT order_id) as invoices

FROM order_item

GROUP BY hsn_code, product_name, gst_rate

ORDER BY hsn_code ASC

";

$stmtHsn = $conn->prepare($hsnSql);


$stmtHsn->execute();

$hsnResult = $stmtHsn->get_result();

$rowNo = 2;

while ($row = $hsnResult->fetch_assoc()) {

$hsnSheet->setCellValue("A$rowNo", $row['hsn_code']);
$hsnSheet->setCellValue("B$rowNo", $row['product_name']);   

   $hsnSheet->setCellValue("C$rowNo", $row['gst_rate']);

$hsnSheet->setCellValue("D$rowNo", $row['total_qty']);

$hsnSheet->setCellValue("E$rowNo", $row['taxable_value']);

$hsnSheet->setCellValue("F$rowNo", $row['cgst']);

$hsnSheet->setCellValue("G$rowNo", $row['sgst']);

$hsnSheet->setCellValue("H$rowNo", $row['igst']);

$hsnSheet->setCellValue("I$rowNo", $row['total_value']);

$hsnSheet->setCellValue("J$rowNo", $row['invoices']);

    $rowNo++;
}

// =====================================================
// DOWNLOAD
// =====================================================

$fileName = "GST_Report_" . $month . ".xlsx";

header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

header("Content-Disposition: attachment; filename=\"$fileName\"");

header('Cache-Control: max-age=0');

$writer = new Xlsx($spreadsheet);

$writer->save('php://output');

exit;