<?php
require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../db_connect.php';

session_start();

header("Content-Type: application/json");

$notifications = [];

/* ---------------- LOW STOCK ---------------- */
$sql1 = "
SELECT product_name, quantity
FROM product
WHERE status = 1 AND quantity <= 5
";

$res1 = $conn->query($sql1);

while ($row = $res1->fetch_assoc()) {
  $notifications[] = [
    "type" => "low_stock",
    "title" => "Low Stock",
    "message" => $row['product_name'] . " is low on stock",
    "extra" => "Qty: " . $row['quantity'],
    "link" => "Items",
    "priority" => "high"
  ];
}

/* ---------------- UNPAID INVOICES ---------------- */
$sql2 = "
SELECT 
  o.order_id,
  o.invoice_no,
  c.name AS customer_name,
  o.grand_total
FROM orders o
LEFT JOIN customers c ON c.id = o.customer_id
WHERE o.payment_status = 0
";

$res2 = $conn->query($sql2);

while ($row = $res2->fetch_assoc()) {
  $notifications[] = [
    "type" => "payment",
    "title" => "Unpaid Invoice",
    "message" => $row['invoice_no'] . " - " . ($row['customer_name'] ?? "Walk-in"),
    "amount" => $row['grand_total'],
    "link" => "SalesInvoice?id=" . $row['order_id'],
    "priority" => "medium",
    "extra" => "Customer: " . ($row['customer_name'] ?? "Walk-in")
  ];
}

/* ---------------- RESPONSE ---------------- */
echo json_encode([
  "status" => "success",
  "data" => $notifications
]);