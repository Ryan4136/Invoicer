<?php
require_once __DIR__ . '/../cors.php';

$conn = new mysqli("localhost","root","","store");
$id = $_GET['id'];

$stmt = $conn->prepare("
DELETE FROM categories 
WHERE categories_id = ?
");

$stmt->bind_param("i", $id);
$stmt->execute();

echo json_encode(["status" => "deleted"]);
