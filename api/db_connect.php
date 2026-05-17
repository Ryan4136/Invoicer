<?php
// C:\Users\Ryan\Invoicer\api\db_connect.php

$host = "localhost";
$user = "root";
$pass = "";
$db   = "store";

// Create connection
$connect = new mysqli($host, $user, $pass, $db);

// Error handling
if ($connect->connect_error) {
    http_response_code(500);
    exit; // No output
}

// Set charset
$connect->set_charset("utf8mb4");

// ✅ Alias for compatibility across project
$conn = $connect;