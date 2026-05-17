<?php
require_once '../cors.php';
require_once '../db_connect.php';

header("Content-Type: application/json");

$conn->begin_transaction();

try {

    $data = json_decode(file_get_contents("php://input"), true);

    if (!$data) {
        throw new Exception("Invalid input");
    }

    // 🔹 Insert into purchases table
    $stmt = $conn->prepare("
        INSERT INTO purchases 
        (invoice_no, invoice_date, supplier_id, supplier_name, gstin, subtotal, tax_amount, total_amount, notes) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");

    $stmt->bind_param(
        "ssissddds",
        $data['invoice_no'],
        $data['invoice_date'],
        $data['supplier_id'],
        $data['supplier_name'],
        $data['gstin'],
        $data['subtotal'],
        $data['tax_amount'],
        $data['total_amount'],
        $data['notes']
    );

    $stmt->execute();

    $purchase_id = $stmt->insert_id;

    // 🔹 Insert items + update stock
    foreach ($data['items'] as $item) {

        // Insert purchase_items
        $stmtItem = $conn->prepare("
            INSERT INTO purchase_items
            (purchase_id, product_id, product_name, quantity, rate, total)
            VALUES (?, ?, ?, ?, ?, ?)
        ");

        $stmtItem->bind_param(
            "iisidd",
            $purchase_id,
            $item['product_id'],
            $item['product_name'],
            $item['quantity'],
            $item['rate'],
            $item['total']
        );

        $stmtItem->execute();

        // 🔹 Update stock
        $stmtStock = $conn->prepare("
            UPDATE products 
            SET current_stock = current_stock + ? 
            WHERE id = ?
        ");

        $stmtStock->bind_param(
            "di",
            $item['quantity'],
            $item['product_id']
        );

        $stmtStock->execute();
    }

    $conn->commit();

    echo json_encode([
        "success" => true,
        "message" => "Purchase created successfully"
    ]);

} catch (Exception $e) {

    $conn->rollback();

    echo json_encode([
        "success" => false,
        "error" => $e->getMessage()
    ]);
}