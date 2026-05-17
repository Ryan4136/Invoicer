<?php
require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../db_connect.php';

$id = $_GET['id'];

$conn->query("DELETE FROM company_users WHERE id=$id");

echo json_encode(["status" => "deleted"]);