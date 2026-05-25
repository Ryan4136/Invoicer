<?php

include "../cors.php";
require_once __DIR__ . "/../db_connect.php";

header("Content-Type: application/json");

$data = json_decode(file_get_contents("php://input"), true);

$orderId = $data['order_id'];
$items = $data['items'];

foreach ($items as $item) {

    $stmt = $conn->prepare("

    INSERT INTO order_item (

        order_id,
        product_id,
        product_name,
        hsn_code,
        quantity,
        rate,
        gst_rate,
        taxable_value,
        cgst,
        sgst,
        igst,
        total

    )

    VALUES (?,?,?,?,?,?,?,?,?,?,?,?)

    ");

    $productId = $item['item_id'] ?? 0;

    $productName = $item['item_name'] ?? '';

    $hsnCode = $item['hsn_code'] ?? '';

    $quantity = (float)($item['quantity'] ?? 0);

    $rate = (float)($item['rate'] ?? 0);

    $gstRate = (float)($item['gst_rate'] ?? 0);

    $taxableValue = (float)($item['taxable_amount'] ?? 0);

    $cgst = (float)($item['cgst_amount'] ?? 0);

    $sgst = (float)($item['sgst_amount'] ?? 0);

    $igst = (float)($item['igst_amount'] ?? 0);

    $total = (float)($item['total_amount'] ?? 0);

    $stmt->bind_param(

        "iissdddddddd",

        $orderId,
        $productId,
        $productName,
        $hsnCode,
        $quantity,
        $rate,
        $gstRate,
        $taxableValue,
        $cgst,
        $sgst,
        $igst,
        $total

    );

    $stmt->execute();
}

echo json_encode([
    "status" => "ok"
]);