<?php
require_once __DIR__ . '/cors.php';

ini_set("session.cookie_samesite", "Lax");
ini_set("session.cookie_secure", "false");
session_start();

header("Content-Type: application/json");

if (isset($_SESSION['user_id'])) {
  echo json_encode([
    "loggedIn" => true,
    "user" => [
      "id" => $_SESSION['user_id'],
      "role" => $_SESSION['role'] // ✅ dynamic role
    ]
  ]);
  exit;
}

echo json_encode(["loggedIn" => false]);