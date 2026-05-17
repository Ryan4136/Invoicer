<?php
require_once __DIR__ . '/../cors.php';

$conn = new mysqli("localhost","root","","store");

$data = json_decode(file_get_contents("php://input"), true);

// ✔ Read the SAME key React sends
$name = $data['brand_name'] ?? '';

$company_id = $data['company_id'] ?? 1;

if (empty($name)) {
  http_response_code(400);
  echo json_encode([
    "status" => "error",
    "message" => "brand_name is required"
  ]);
  exit;
}

$stmt = $conn->prepare("
  INSERT INTO brands (brand_name, brand_active, brand_status, company_id)
  VALUES (?, 1, 1, ?)
");

$stmt->bind_param("si", $name, $company_id);
$stmt->execute();

echo json_encode([
  "status" => "success",
  "id" => $conn->insert_id
]);