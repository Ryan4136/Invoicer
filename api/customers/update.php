<?php
require_once '../cors.php';
require_once '../db_connect.php';

$data = json_decode(file_get_contents("php://input"), true);

$stmt = $conn->prepare("
UPDATE customers 
SET name=?, phone=?, gstin=?, state_code=?, customer_type=?, address=? 
WHERE id=?
");

$stmt->bind_param(
    "sssissi",
    $data['name'],
    $data['phone'],
    $data['gstin'],
    $data['state_code'],
    $data['customer_type'],
    $data['address'],
    $data['id']
);

$stmt->execute();

echo json_encode(["success" => true]);