<?php
include __DIR__ . "/cors.php";

header("Content-Type: application/json");

$uploadDir = __DIR__ . "/../uploads/company_logos/";

// Create folder if not exists
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0777, true);
}

if (!isset($_FILES['file'])) {
    echo json_encode([
        "success" => false,
        "message" => "No file uploaded"
    ]);
    exit;
}

$file = $_FILES['file'];

$fileName = time() . "_" . basename($file['name']);
$targetPath = $uploadDir . $fileName;

if (move_uploaded_file($file['tmp_name'], $targetPath)) {
    echo json_encode([
        "success" => true,
        "file_url" => "uploads/company_logos/" . $fileName
    ]);
} else {
    echo json_encode([
        "success" => false,
        "message" => "Upload failed"
    ]);
}