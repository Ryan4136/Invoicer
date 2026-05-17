<?php
require_once '../cors.php';
require_once '../db_connect.php';

header("Content-Type: application/json");

$sql = "SELECT * FROM purchases ORDER BY purchase_id DESC";
$result = $conn->query($sql);

$data = [];

while ($row = $result->fetch_assoc()) {
    $data[] = $row;
}

echo json_encode(["data" => $data]);