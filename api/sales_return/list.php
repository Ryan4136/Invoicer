<?php
require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../db_connect.php';

$sql = "
SELECT 
  sr.return_id,
  sr.order_id,
  sr.return_date,
  sr.total_amount,
  sr.reason,
  o.invoice_no,
  o.customer_name
FROM sales_return sr
LEFT JOIN orders o ON sr.order_id = o.order_id
ORDER BY sr.return_id DESC
";

$result = $conn->query($sql);

$data = [];

while ($row = $result->fetch_assoc()) {
  $data[] = $row;
}

echo json_encode($data);