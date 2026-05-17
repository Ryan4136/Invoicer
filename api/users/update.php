<?php
require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../db_connect.php';

$data = json_decode(file_get_contents("php://input"), true);

$id = $data['id'] ?? null;

if (!$id) {
    echo json_encode(["error" => "Missing user id"]);
    exit;
}

$updates = [];

// username
if (isset($data['username'])) {
    $updates[] = "username='" . $conn->real_escape_string($data['username']) . "'";
}

// email
if (isset($data['email'])) {
    $updates[] = "email='" . $conn->real_escape_string($data['email']) . "'";
}

// role
if (isset($data['role'])) {
    $updates[] = "role='" . $conn->real_escape_string($data['role']) . "'";
}

// password (only if provided)
if (!empty($data['password'])) {
    $hashed = md5($data['password']);
    $updates[] = "password='$hashed'";
}

// execute update
if (!empty($updates)) {
    $sql = "UPDATE users SET " . implode(", ", $updates) . " WHERE user_id=$id";
    $conn->query($sql);
}

echo json_encode(["status" => "updated"]);