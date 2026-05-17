<?php
require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../db_connect.php';

$data = json_decode(file_get_contents("php://input"), true);

$id = $data['id'];

$sql = "UPDATE company_users SET
role='{$data['role']}',
permissions='".json_encode($data['permissions'])."',
is_active=".($data['is_active'] ? 1 : 0)."
WHERE id=$id";

$conn->query($sql);

echo json_encode(["status" => "updated"]);