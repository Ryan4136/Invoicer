<?php
require_once __DIR__ . '/../db_connect.php';

$data = json_decode(file_get_contents("php://input"), true);

$return_id = $data['return_id'];
$total_amount = $data['grand_total'];
$reason = $data['reason'];
$items = $data['items'];

// Update main
$stmt = $conn->prepare("
  UPDATE sales_return 
  SET total_amount = ?, reason = ?
  WHERE return_id = ?
");

$stmt->bind_param("dsi", $total_amount, $reason, $return_id);
$stmt->execute();

// Delete old items
$conn->query("DELETE FROM sales_return_item WHERE return_id = $return_id");

// Insert new items
foreach ($items as $item) {
  $stmt2 = $conn->prepare("
    INSERT INTO sales_return_item 
    (return_id, order_item_id, product_id, return_qty, rate, total)
    VALUES (?, ?, ?, ?, ?, ?)
  ");

  $total = $item['return_qty'] * $item['rate'];

  $stmt2->bind_param(
    "iiiddd",
    $return_id,
    $item['order_item_id'],
    $item['product_id'],
    $item['return_qty'],
    $item['rate'],
    $total
  );

  $stmt2->execute();
}

echo json_encode(["status" => "updated"]);