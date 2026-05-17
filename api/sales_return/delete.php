<?php
require_once __DIR__ . '/../db_connect.php';

$data = json_decode(file_get_contents("php://input"), true);

$return_id = $data['return_id'];

// Delete items
$conn->query("DELETE FROM sales_return_item WHERE return_id = $return_id");

// Delete main
$conn->query("DELETE FROM sales_return WHERE return_id = $return_id");

echo json_encode(["status" => "deleted"]);