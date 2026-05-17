<?php
require_once '../cors.php';
require_once '../db_connect.php';

$data = json_decode(file_get_contents("php://input"), true);

$stmt = $conn->prepare("DELETE FROM customers WHERE id=?");
$stmt->bind_param("i", $data['id']);
$stmt->execute();

echo json_encode(["success" => true]);