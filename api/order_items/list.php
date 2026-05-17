<?php
include "../cors.php";
require_once __DIR__ . "/../db_connect.php";

$conn = new mysqli("localhost","root","","store");

$order_id = $_GET['order_id'] ?? 0;

$stmt = $conn->prepare("
SELECT 
  oi.product_id,
  oi.quantity,
  oi.rate,
  oi.gst_rate,
  oi.total,
  p.product_name AS item_name,
  p.hsn AS hsn_code
FROM order_item oi
LEFT JOIN product p ON p.product_id = oi.product_id
WHERE oi.order_id = ?
");

$stmt->bind_param("i", $order_id);
$stmt->execute();

$result = $stmt->get_result();

$items = [];

while ($row = $result->fetch_assoc()) {

  $taxable = $row['quantity'] * $row['rate'];
  $gstAmount = ($taxable * $row['gst_rate']) / 100;

  $items[] = [
    "item_name" => $row["item_name"],
    "item_code" => "",
    "hsn_code" => $row["hsn_code"],
    "unit" => "PCS",
    "quantity" => (float)$row["quantity"],
    "rate" => (float)$row["rate"],
    "gst_rate" => (float)$row["gst_rate"],
    "taxable_amount" => $taxable,
    "cgst_amount" => $gstAmount / 2,
    "sgst_amount" => $gstAmount / 2,
    "igst_amount" => 0,
    "total_amount" => $row["total"]
  ];
}

header("Content-Type: application/json");
echo json_encode($items);