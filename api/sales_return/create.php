<?php
require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../db_connect.php';


$data = json_decode(file_get_contents("php://input"), true);

$order_id = $data['order_id'];
$total_amount = $data['grand_total'];
$reason = $data['reason'];
$items = $data['items'];

// Insert return
$stmt = $conn->prepare("
  INSERT INTO sales_return (order_id, return_date, total_amount, reason)
  VALUES (?, NOW(), ?, ?)
");

$stmt->bind_param("ids", $order_id, $total_amount, $reason);
$stmt->execute();

$return_id = $stmt->insert_id;

// Insert items
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

echo json_encode(["status" => "success"]);