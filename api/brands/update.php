<?php
require_once __DIR__ . '/../cors.php';

$conn = new mysqli("localhost","root","","store");
$data = json_decode(file_get_contents("php://input"), true);

$id   = $data['id'];
$name = $data['name'];
$active = $data['is_active'] ? 1 : 0;

$stmt = $conn->prepare("
  UPDATE brands 
  SET brand_name = ?, brand_active = ?
  WHERE brand_id = ?
");

$stmt->bind_param("sii", $name, $active, $id);
$stmt->execute();

echo json_encode(["status"=>"updated"]);
