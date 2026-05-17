<?php
require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../db_connect.php';

header("Content-Type: application/json");

$data = json_decode(file_get_contents("php://input"), true);

$stmt = $connect->prepare("DELETE FROM suppliers WHERE id=?");
$stmt->bind_param("i", $data['id']);

if ($stmt->execute()) {
  echo json_encode(["success" => true]);
} else {
  echo json_encode([
    "success" => false,
    "error" => $stmt->error
  ]);
}