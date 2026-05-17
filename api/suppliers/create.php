<?php
require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../db_connect.php';

header("Content-Type: application/json");

$data = json_decode(file_get_contents("php://input"), true);

$stmt = $connect->prepare("
INSERT INTO suppliers 
(name, phone, gstin, email, address, city, state, pincode, opening_balance, current_balance, is_active, company_id)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
");

$stmt->bind_param(
  "ssssssssddii",
  $data['name'],
  $data['phone'],
  $data['gstin'],
  $data['email'],
  $data['address'],
  $data['city'],
  $data['state'],
  $data['pincode'],
  $data['opening_balance'],
  $data['current_balance'],
  $data['is_active'],
  $data['company_id']
);

if ($stmt->execute()) {
  echo json_encode([
    "success" => true,
    "id" => $stmt->insert_id
  ]);
} else {
  echo json_encode([
    "success" => false,
    "error" => $stmt->error
  ]);
}