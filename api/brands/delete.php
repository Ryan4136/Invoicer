<?php
require_once __DIR__ . '/../cors.php';
require_once __DIR__ . "/../db_connect.php";


$conn = new mysqli("localhost","root","","store");
$id = $_GET['id'];

$conn->query("UPDATE brands SET brand_status = 0 WHERE brand_id = $id");

echo json_encode(["status"=>"deleted"]);
