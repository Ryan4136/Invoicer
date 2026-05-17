<?php
require_once __DIR__ . '/../db_connect.php';

$return_id = $_GET['id'];

$sql = "
SELECT * FROM sales_return WHERE return_id = ?
";

$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $return_id);
$stmt->execute();

$result = $stmt->get_result();
$return = $result->fetch_assoc();

// Fetch items
$sql2 = "
SELECT * FROM sales_return_item WHERE return_id = ?
";

$stmt2 = $conn->prepare($sql2);
$stmt2->bind_param("i", $return_id);
$stmt2->execute();

$result2 = $stmt2->get_result();

$items = [];
while ($row = $result2->fetch_assoc()) {
  $items[] = $row;
}

$return['items'] = $items;

echo json_encode($return);