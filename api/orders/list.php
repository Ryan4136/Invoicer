<?php
include "../cors.php";
require_once __DIR__ . "/../db_connect.php";

$conn = new mysqli("localhost","root","","store");

// ✅ GET QUERY PARAMS
$page = isset($_GET['page']) ? (int)$_GET['page'] : 1;

$limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;

$report_mode = isset($_GET['report']) ? true : false;
$search = $_GET['search'] ?? '';
$status = $_GET['status'] ?? '';
$start_date = $_GET['start_date'] ?? '';
$end_date = $_GET['end_date'] ?? '';

$offset = ($page - 1) * $limit;

// ✅ BUILD WHERE
$where = "WHERE 1=1";
$params = [];
$types = "";

// 🔍 SEARCH
if (!empty($search)) {
  $where .= " AND (
    invoice_no LIKE ? OR
    client_name LIKE ? OR
    order_id LIKE ?
  )";
  $searchTerm = "%$search%";
  $params[] = $searchTerm;
  $params[] = $searchTerm;
  $params[] = $searchTerm;
  $types .= "sss";
}

// 📅 DATE FILTER
if (!empty($start_date) && !empty($end_date)) {

  $where .= " AND DATE(order_date) BETWEEN ? AND ?";

  $params[] = $start_date;
  $params[] = $end_date;

  $types .= "ss";
}

// 📊 STATUS
if ($status !== '') {
  $where .= " AND order_status = ?";
  $params[] = $status;
  $types .= "i";
}

// ✅ MAIN QUERY
$sql = "
SELECT *

FROM orders

$where

ORDER BY order_id DESC

";
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


    // Convert payment status


    $data[] = $row;
}

// ✅ TOTAL COUNT
$countSql = "SELECT COUNT(*) as total FROM orders $where";

$countStmt = $conn->prepare($countSql);

// Use ONLY filter params (without pagination)
$countParams = [];
$countTypes = "";

// SEARCH
if (!empty($search)) {
    $searchTerm = "%$search%";

    $countParams[] = $searchTerm;
    $countParams[] = $searchTerm;
    $countParams[] = $searchTerm;

    $countTypes .= "sss";
}

// DATE
if (!empty($start_date) && !empty($end_date)) {

    $countParams[] = $start_date;
    $countParams[] = $end_date;

    $countTypes .= "ss";
}

// STATUS
if ($status !== '') {

    $countParams[] = $status;

    $countTypes .= "i";
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