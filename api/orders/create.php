<?php
include "../cors.php";
require_once __DIR__ . "/../db_connect.php";

$conn = new mysqli("localhost","root","","store");

$data = json_decode(file_get_contents("php://input"), true);

// ✅ DEFINE IDS
$companyId = $data['company_id'] ?? 1;
$user_id   = $data['user_id'] ?? 1;

// ✅ MAP DATA
$order_date      = $data['order_date'];
$client_name     = $data['client_name'];
$client_contact  = $data['client_contact'] ?? '';

$sub_total       = $data['sub_total'];
$vat             = $data['vat'];
$total_amount    = $data['total_amount'];
$discount        = $data['discount'];
$grand_total     = $data['grand_total'];

$paid            = $data['paid'] ?? 0;
$due             = $data['due'] ?? 0;

$payment_type    = $data['payment_type'] ?? 'cash';
$payment_status  = $data['payment_status'] ?? 0;
$payment_place   = $data['payment_place'] ?? 1;

$order_status    = $data['order_status'] ?? 1;

// 🔥 GET COMPANY SETTINGS
$stmt2 = $conn->prepare("SELECT invoice_prefix_order, invoice_counter FROM company_settings WHERE company_id = ?");
$stmt2->bind_param("i", $companyId);
$stmt2->execute();
$result = $stmt2->get_result();
$company = $result->fetch_assoc();

// 🔥 FINANCIAL YEAR
$today = new DateTime();
$month = (int)$today->format('m');
$year = (int)$today->format('Y');

if ($month >= 4) {
    $fy = substr($year, -2) . "-" . substr($year + 1, -2);
} else {
    $fy = substr($year - 1, -2) . "-" . substr($year, -2);
}

// 🔥 GENERATE INVOICE NUMBER
$prefix = $company['invoice_prefix_order'] ?? 'INV';
$counter = (int)($company['invoice_counter'] ?? 1);

$invoice_no = $prefix . "/" . $fy . "/" . str_pad($counter, 5, "0", STR_PAD_LEFT);

// ✅ FIX VARIABLE
$company_id = $companyId;

// 🔥 INSERT
$stmt = $conn->prepare("
INSERT INTO orders (
  invoice_no,
  order_date,
  client_name,
  client_contact,
  sub_total,
  vat,
  total_amount,
  discount,
  grand_total,
  paid,
  due,
  payment_type,
  payment_status,
  payment_place,
  order_status,
  user_id,
  company_id
)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
");

$stmt->bind_param(
  "ssssssssssssssiii",
  $invoice_no,
  $order_date,
  $client_name,
  $client_contact,
  $sub_total,
  $vat,
  $total_amount,
  $discount,
  $grand_total,
  $paid,
  $due,
  $payment_type,
  $payment_status,
  $payment_place,
  $order_status,
  $user_id,
  $company_id
);

$stmt->execute();

// 🔥 UPDATE COUNTER
$newCounter = $counter + 1;

$update = $conn->prepare("UPDATE company_settings SET invoice_counter = ? WHERE company_id = ?");
$update->bind_param("ii", $newCounter, $companyId);
$update->execute();

echo json_encode(["order_id" => $conn->insert_id]);
?>