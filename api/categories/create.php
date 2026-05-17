<?php
require_once __DIR__ . '/../cors.php';

$conn = new mysqli("localhost","root","","store");
$data = json_decode(file_get_contents("php://input"), true);

$name = $data['categories_name'] ?? '';
$active = $data['categories_active'] ?? 1;
$status = 1;
$company_id = $data['company_id'] ?? 1;

$stmt = $conn->prepare("
INSERT INTO categories 
(categories_name, categories_active, categories_status, company_id)
VALUES (?,?,?,?)
");

$stmt->bind_param("siii", $name, $active, $status, $company_id);
$stmt->execute();

echo json_encode(["status" => "success"]);
