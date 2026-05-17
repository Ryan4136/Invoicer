<?php
require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../db_connect.php';

$sql = "SELECT * FROM users ORDER BY created_date DESC";
$result = $conn->query($sql);

$users = [];

while ($row = $result->fetch_assoc()) {
    $row['id'] = $row['user_id'];
    $row['user_email'] = $row['email'];
    $row['permissions'] = $row['permissions']
        ? json_decode($row['permissions'], true)
        : [];
    $users[] = $row;
}

echo json_encode($users);