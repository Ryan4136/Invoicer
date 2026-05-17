<?php
require_once __DIR__ . '/../cors.php';

$data = json_decode(file_get_contents("php://input"), true);
$id = $data['id'];

$conn = new mysqli("localhost", "root", "", "store");

$stmt = $conn->prepare("
UPDATE product SET
  product_name = ?,
  hsn = ?,
  categories_id = ?,
  brand_id = ?,
  rate = ?,
  mrp = ?,
  gst_rate = ?,
  quantity = ?
WHERE product_id = ?
");

$stmt->bind_param(
  "ssssdddii",
  $data['name'],
  $data['hsn_code'],
  $data['category'],
  $data['brand'],
  $data['sale_price'],
  $data['mrp'],
  $data['gst_rate'],
  $data['current_stock'],
  $id
);

if ($stmt->execute()) {
  echo json_encode(["status" => "success"]);
} else {
  echo json_encode([
    "status" => "error",
    "message" => $conn->error
  ]);
}
