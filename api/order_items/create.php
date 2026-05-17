<?php
include "../cors.php";
require_once __DIR__ . "/../db_connect.php";

$conn = new mysqli("localhost","root","","store");
$data = json_decode(file_get_contents("php://input"), true);
$orderId = $data['order_id'];
$items = $data['items'];

foreach ($items as $item) {

  $stmt = $conn->prepare("
  INSERT INTO order_item 
  (order_id, product_id, quantity, rate, gst_rate, total)
  VALUES (?,?,?,?,?,?)
  ");

  $stmt->bind_param(
  "iidddd",
  $orderId,
  $item['item_id'],
  $item['quantity'],
  $item['rate'],
  $item['gst_rate'],
  $item['total_amount']
  );

  $stmt->execute();
}

echo json_encode(["status"=>"ok"]);
?>
