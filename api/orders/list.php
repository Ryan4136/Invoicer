<?php
include "../cors.php";
require_once __DIR__ . "/../db_connect.php";

$conn = new mysqli("localhost","root","","store");

// ✅ GET QUERY PARAMS
$page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
$limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
$search = $_GET['search'] ?? '';
$status = $_GET['status'] ?? '';
$from_date = $_GET['from_date'] ?? '';
$to_date = $_GET['to_date'] ?? '';

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
if (!empty($from_date)) {
  $where .= " AND order_date >= ?";
  $params[] = $from_date;
  $types .= "s";
}

if (!empty($to_date)) {
  $where .= " AND order_date <= ?";
  $params[] = $to_date;
  $types .= "s";
}

// 📊 STATUS
if ($status !== '') {
  $where .= " AND order_status = ?";
  $params[] = $status;
  $types .= "i";
}

// ✅ MAIN QUERY
$sql = "SELECT * FROM orders $where ORDER BY order_id DESC LIMIT ? OFFSET ?";
$params[] = $limit;
$params[] = $offset;
$types .= "ii";

$stmt = $conn->prepare($sql);
$stmt->bind_param($types, ...$params);
$stmt->execute();

$result = $stmt->get_result();
$data = [];

while ($row = $result->fetch_assoc()) {
  $data[] = $row;
}

// ✅ TOTAL COUNT
$countSql = "SELECT COUNT(*) as total FROM orders $where";
$countStmt = $conn->prepare($countSql);

// remove LIMIT + OFFSET types
$countTypes = substr($types, 0, -2);
$countParams = array_slice($params, 0, -2);

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