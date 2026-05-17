<?php
require_once __DIR__ . '/cors.php';

ini_set("session.cookie_samesite", "Lax");
ini_set("session.cookie_secure", "false");
session_start();

/*
 We are SWITCHING from react_auth → store
*/
$conn = new mysqli("localhost", "root", "", "store");

$data = json_decode(file_get_contents("php://input"), true);

$username = $data['username'] ?? '';
$password = $data['password'] ?? '';

if (!$username || !$password) {
  echo json_encode([
    "status" => "error",
    "message" => "Username and password required"
  ]);
  exit;
}

/*
 In store.users, passwords are stored as MD5
*/
$hashedPassword = md5($password);

/*
 Fetch user from store.users
*/
$stmt = $conn->prepare(
  "SELECT user_id, username, role, company_id 
   FROM users 
   WHERE username = ? AND password = ?"
);
$stmt->bind_param("ss", $username, $hashedPassword);
$stmt->execute();
$res = $stmt->get_result();

if ($res->num_rows === 0) {
  echo json_encode([
    "status" => "error",
    "message" => "Invalid credentials"
  ]);
  exit;
}

$user = $res->fetch_assoc();

/* ---- set sessions to match your app style ---- */
$_SESSION['user_id']   = $user['user_id'];
$_SESSION['role']      = $user['role'];
$_SESSION['company_id'] = $user['company_id'];

echo json_encode([
  "status" => "success",
  "type"   => $user['role'],   // superadmin | admin | user
  "user"   => [
    "id" => $user['user_id'],
    "username" => $user['username'],
    "role" => $user['role'],
    "company_id" => $user['company_id']
  ]
]);
