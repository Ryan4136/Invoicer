<?php
require_once '../cors.php';
require_once '../db_connect.php';

$sql = "SELECT * FROM suppliers ORDER BY name ASC";
$result = $connect->query($sql);

$data = [];

while ($row = $result->fetch_assoc()) {
    $data[] = $row;
}

echo json_encode(["data" => $data]);