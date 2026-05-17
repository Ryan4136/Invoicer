<?php
require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../db_connect.php';

$data = json_decode(file_get_contents("php://input"), true);

$name = $data['name'];
$email = $data['email'];
$role = $data['role'];
$permissions = json_encode($data['permissions']);
$company_id = $data['company_id'];
$is_active = $data['is_active'] ? 1 : 0;

$password = md5("123456");

$sql = "INSERT INTO company_users 
(name, email, password, role, permissions, company_id, is_active) 
VALUES 
('$name','$email','$password','$role','$permissions','$company_id','$is_active')";

$conn->query($sql);

echo json_encode(["status" => "success"]);
