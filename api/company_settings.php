<?php
include __DIR__ . "/cors.php";

error_reporting(E_ALL);
ini_set('display_errors', 1);

header("Content-Type: application/json");

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

/*
|--------------------------------------------------------------------------
| Direct DB connection (same style as your working APIs)
|--------------------------------------------------------------------------
*/
$conn = new mysqli("localhost", "root", "", "store");

if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Database connection failed",
        "error" => $conn->connect_error
    ]);
    exit;
}

$conn->set_charset("utf8mb4");

/*
|--------------------------------------------------------------------------
| Session check
|--------------------------------------------------------------------------
*/
if (!isset($_SESSION['company_id'], $_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode([
        "success" => false,
        "message" => "Unauthorized. Company session not found.",
        "session" => $_SESSION
    ]);
    exit;
}

$companyId = (int)$_SESSION['company_id'];
$userId    = (int)$_SESSION['user_id'];

$method = $_SERVER['REQUEST_METHOD'];

/*
|--------------------------------------------------------------------------
| GET COMPANY SETTINGS
|--------------------------------------------------------------------------
*/
if ($method === "GET") {
    $sql = "SELECT * FROM company_settings WHERE company_id = ? AND user_id = ? LIMIT 1";
    $stmt = $conn->prepare($sql);

    if (!$stmt) {
        http_response_code(500);
        echo json_encode([
            "success" => false,
            "message" => "Prepare failed",
            "error" => $conn->error
        ]);
        exit;
    }

    $stmt->bind_param("ii", $companyId, $userId);
    $stmt->execute();

    $result = $stmt->get_result();
    $company = $result->fetch_assoc();

    echo json_encode([
        "success" => true,
        "data" => $company ?: null,
        "debug" => [
            "company_id" => $companyId,
            "user_id" => $userId
        ]
    ]);
    exit;
}

/*
|--------------------------------------------------------------------------
| SAVE / UPDATE COMPANY SETTINGS
|--------------------------------------------------------------------------
*/
if ($method === "POST") {
    $data = json_decode(file_get_contents("php://input"), true);

    if (!$data) {
        http_response_code(400);
        echo json_encode([
            "success" => false,
            "message" => "Invalid JSON payload"
        ]);
        exit;
    }

    $company_name = trim($data['name'] ?? '');
    $address = trim($data['address'] ?? '');
    $city = trim($data['city'] ?? '');
    $state = trim($data['state'] ?? '');
    $pincode = trim($data['pincode'] ?? '');
    $phone = trim($data['phone'] ?? '');
    $email = trim($data['email'] ?? '');
    $gstin = strtoupper(trim($data['gstin'] ?? ''));
    $pan = strtoupper(trim($data['pan'] ?? ''));
    $logo_path = trim($data['logo_url'] ?? '');
    $bank_name = trim($data['bank_name'] ?? '');
    $bank_branch = trim($data['bank_branch'] ?? '');
    $account_number = trim($data['bank_account'] ?? '');
    $ifsc = strtoupper(trim($data['bank_ifsc'] ?? ''));
    $invoice_prefix_order = strtoupper(trim($data['invoice_prefix'] ?? 'INV'));
    $state_code = trim($data['state_code'] ?? '');
$invoice_counter = (int)($data['invoice_counter'] ?? 1);
$financial_year_start = $data['financial_year_start'] ?? null;
$composition_scheme = !empty($data['composition_scheme']) ? 1 : 0;
$is_active = !empty($data['is_active']) ? 1 : 0;

    if ($company_name === '') {
        http_response_code(422);
        echo json_encode([
            "success" => false,
            "message" => "Company name is required"
        ]);
        exit;
    }

    $checkSql = "SELECT company_id FROM company_settings WHERE company_id = ? AND user_id = ? LIMIT 1";
    $checkStmt = $conn->prepare($checkSql);

    if (!$checkStmt) {
        http_response_code(500);
        echo json_encode([
            "success" => false,
            "message" => "Prepare failed (check)",
            "error" => $conn->error
        ]);
        exit;
    }

    $checkStmt->bind_param("ii", $companyId, $userId);
    $checkStmt->execute();
    $exists = $checkStmt->get_result()->num_rows > 0;
    $checkStmt->close();

    if ($exists) {
        $sql = "
            UPDATE company_settings SET
    company_name = ?,
    address = ?,
    city = ?,
    state = ?,
    state_code = ?,
    pincode = ?,
    phone = ?,
    email = ?,
    gstin = ?,
    pan = ?,
    logo_path = ?,
    bank_name = ?,
    bank_branch = ?,
    account_number = ?,
    ifsc = ?,
    invoice_prefix_order = ?,
    invoice_counter = ?,
    financial_year_start = ?,
    composition_scheme = ?,
    is_active = ?
            WHERE company_id = ? AND user_id = ?
        ";

        $stmt = $conn->prepare($sql);

        if (!$stmt) {
            http_response_code(500);
            echo json_encode([
                "success" => false,
                "message" => "Prepare failed (update)",
                "error" => $conn->error
            ]);
            exit;
        }

        $stmt->bind_param(
    "ssssssssssssssssissiii",
            $company_name,
$address,
$city,
$state,
$state_code,
$pincode,
$phone,
$email,
$gstin,
$pan,
$logo_path,
$bank_name,
$bank_branch,
$account_number,
$ifsc,
$invoice_prefix_order,
$invoice_counter,
$financial_year_start,
$composition_scheme,
$is_active,
$companyId,
$userId
        );
    } else {
        $sql = "
            INSERT INTO company_settings (
    company_id,
    user_id,
    company_name,
    address,
    city,
    state,
    state_code,
    pincode,
    phone,
    email,
    gstin,
    pan,
    logo_path,
    bank_name,
    bank_branch,
    account_number,
    ifsc,
    invoice_prefix_order,
    invoice_counter,
    financial_year_start,
    composition_scheme,
    is_active
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

        $stmt = $conn->prepare($sql);

        if (!$stmt) {
            http_response_code(500);
            echo json_encode([
                "success" => false,
                "message" => "Prepare failed (insert)",
                "error" => $conn->error
            ]);
            exit;
        }

       $stmt->bind_param(
    "iissssssssssssssissii",
    $companyId,
    $userId,
    $company_name,
    $address,
    $city,
    $state,
    $state_code,
    $pincode,
    $phone,
    $email,
    $gstin,
    $pan,
    $logo_path,
    $bank_name,
    $bank_branch,
    $account_number,
    $ifsc,
    $invoice_prefix_order,
    $invoice_counter,
    $financial_year_start,
    $composition_scheme,
    $is_active
);
    }

    if (!$stmt->execute()) {
        http_response_code(500);
        echo json_encode([
            "success" => false,
            "message" => "Execute failed",
            "error" => $stmt->error
        ]);
        exit;
    }

    echo json_encode([
        "success" => true,
        "message" => "Company settings saved successfully"
    ]);
    exit;
}

/*
|--------------------------------------------------------------------------
| INVALID METHOD
|--------------------------------------------------------------------------
*/
http_response_code(405);
echo json_encode([
    "success" => false,
    "message" => "Method not allowed"
]);