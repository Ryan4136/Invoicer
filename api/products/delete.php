<?php
require_once __DIR__ . '/../cors.php';

$data = json_decode(file_get_contents("php://input"), true);
$id = $data['id'];

$conn = new mysqli("localhost", "root", "", "store");

$stmt = $conn->prepare("UPDATE product SET status = 0 WHERE product_id = ?");
$stmt->bind_param("i", $id);

if ($stmt->execute()) {
  echo json_encode(["status" => "success"]);
} else {
  echo json_encode([
    "status" => "error",
    "message" => $conn->error
  ]);
}
