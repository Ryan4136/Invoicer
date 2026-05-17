<?php
require_once __DIR__ . '/../cors.php';

$conn = new mysqli("localhost","root","","store");
$data = json_decode(file_get_contents("php://input"), true);

$id = $data['categories_id'];
$name = $data['categories_name'];
$active = $data['categories_active'] ?? 1;

$stmt = $conn->prepare("
UPDATE categories 
SET categories_name=?, categories_active=?
WHERE categories_id=?
");

$stmt->bind_param("sii", $name, $active, $id);
$stmt->execute();

echo json_encode(["status" => "updated"]);
