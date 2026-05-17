<?php
require_once __DIR__ . '/../cors.php';

$data = json_decode(file_get_contents("php://input"), true);

$conn = new mysqli("localhost", "root", "", "store");

$stmt = $conn->prepare("
INSERT INTO product 
(product_name, hsn, categories_id, brand_id, rate, mrp, gst_rate, quantity, status)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
");

$stmt->bind_param(
  "ssssdddi",
  $data['name'],
  $data['hsn_code'],
  $data['category'],
  $data['brand'],
  $data['sale_price'],
  $data['mrp'],
  $data['gst_rate'],
  $data['opening_stock']
);

if ($stmt->execute()) {
  echo json_encode([
    "status" => "success",
    "id" => $conn->insert_id
  ]);
} else {
  echo json_encode([
    "status" => "error",
    "message" => $conn->error
  ]);
}
