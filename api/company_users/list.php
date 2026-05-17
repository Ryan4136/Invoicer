<?php
require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../db_connect.php';

$sql = "SELECT * FROM company_users ORDER BY created_date DESC";
$result = $conn->query($sql);

$data = [];

while ($row = $result->fetch_assoc()) {
    $row['permissions'] = $row['permissions']
        ? json_decode($row['permissions'], true)
        : [];

    // normalize for frontend
    $row['user_email'] = $row['email'] ?: $row['name'];

    $data[] = $row;
}

echo json_encode($data);