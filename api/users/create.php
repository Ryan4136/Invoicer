<?php
require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../db_connect.php';

$data = json_decode(file_get_contents("php://input"), true);

$email = $data['user_email'];
$role = $data['role'];
$permissions = json_encode($data['permissions']);
$is_active = $data['is_active'] ? 1 : 0;
$company_id = $data['company_id'];

$password = md5("123456"); // default password

$sql = "INSERT INTO users (username, password, role, email, company_id, permissions, is_active)
VALUES ('$email', '$password', '$role', '$email', '$company_id', '$permissions', '$is_active')";

$conn->query($sql);

echo json_encode(["status" => "success"]);