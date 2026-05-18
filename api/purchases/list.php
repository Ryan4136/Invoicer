<?php

require_once '../cors.php';
require_once '../db_connect.php';

header("Content-Type: application/json");

// Pagination
$page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
$limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;

$report_mode = isset($_GET['report']) ? true : false;

// Filters
$search = $_GET['search'] ?? '';
$start_date = $_GET['start_date'] ?? '';
$end_date = $_GET['end_date'] ?? '';

$offset = ($page - 1) * $limit;

// WHERE
$where = "WHERE 1=1";

$params = [];
$types = "";

// SEARCH
if (!empty($search)) {

    $where .= " AND (
        supplier_name LIKE ?
        OR purchase_id LIKE ?
    )";

    $searchTerm = "%$search%";

    $params[] = $searchTerm;
    $params[] = $searchTerm;

    $types .= "ss";
}

// DATE FILTER
if (!empty($start_date) && !empty($end_date)) {

    $where .= " AND DATE(purchase_date) BETWEEN ? AND ?";

    $params[] = $start_date;
    $params[] = $end_date;

    $types .= "ss";
}

// MAIN QUERY
$sql = "
SELECT *
FROM purchases
$where
ORDER BY purchase_id DESC
";

// Add pagination only if NOT report mode
if (!$report_mode) {

    $sql .= " LIMIT ? OFFSET ?";

    $params[] = $limit;
    $params[] = $offset;

    $types .= "ii";
}

$stmt = $conn->prepare($sql);

if (!empty($types)) {
    $stmt->bind_param($types, ...$params);
}

$stmt->execute();

$result = $stmt->get_result();

$data = [];

while ($row = $result->fetch_assoc()) {

    $due = (float)$row['due'];
    $grandTotal = (float)$row['grand_total'];
    $vat = (float)$row['vat'];

    // Payment status mapping
    if ($due <= 0) {

        $paymentStatus = 1;

    } elseif ($due < $grandTotal) {

        $paymentStatus = 2;

    } else {

        $paymentStatus = 0;
    }

    $data[] = [
        ...$row,

        // Frontend-compatible fields
        'invoice_no' => 'PUR-' . $row['purchase_id'],

        'invoice_date' => date('Y-m-d', strtotime($row['purchase_date'])),

        'customer_name' => $row['supplier_name'],

        'customer_gstin' => $row['supplier_gst'],

        'taxable_amount' => (float)$row['sub_total'],

        'cgst_total' => $vat / 2,

        'sgst_total' => $vat / 2,

        'igst_total' => 0,

        'balance_due' => $row['due'],

        'payment_status' => $paymentStatus
    ];
}

// COUNT QUERY
$countSql = "
SELECT COUNT(*) as total
FROM purchases
$where
";

$countStmt = $conn->prepare($countSql);

$countParams = [];
$countTypes = "";

// SEARCH
if (!empty($search)) {

    $searchTerm = "%$search%";

    $countParams[] = $searchTerm;
    $countParams[] = $searchTerm;

    $countTypes .= "ss";
}

// DATE
if (!empty($start_date) && !empty($end_date)) {

    $countParams[] = $start_date;
    $countParams[] = $end_date;

    $countTypes .= "ss";
}

if (!empty($countTypes)) {
    $countStmt->bind_param($countTypes, ...$countParams);
}

$countStmt->execute();

$countResult = $countStmt->get_result()->fetch_assoc();

echo json_encode([
    "data" => $data,
    "total" => (int)$countResult['total'],
    "page" => $page,
    "limit" => $limit
]);