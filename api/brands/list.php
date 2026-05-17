<?php
include "../cors.php";
require_once __DIR__ . "/../db_connect.php";

$conn = new mysqli("localhost","root","","store");

$sql = "
SELECT 
  b.brand_id,
  b.brand_name,
  COUNT(p.product_id) AS itemCount,
  COALESCE(SUM(CAST(p.quantity AS DECIMAL(12,2))), 0) AS totalStock,
  COALESCE(SUM(CAST(p.quantity AS DECIMAL(12,2)) * CAST(p.rate AS DECIMAL(12,2))), 0) AS totalValue
FROM brands b
LEFT JOIN product p 
  ON p.brand_id = b.brand_id
  AND p.active = 1
  AND p.status = 1
GROUP BY b.brand_id, b.brand_name
ORDER BY b.brand_name ASC;
";

$result = $conn->query($sql);

$brands = [];

while ($row = $result->fetch_assoc()) {
  $brands[] = [
    "id" => (int) $row["brand_id"],
    "name" => $row["brand_name"],
    "itemCount" => (int) $row["itemCount"],
    "totalStock" => (float) $row["totalStock"],
    "totalValue" => (float) $row["totalValue"]
  ];
}

echo json_encode($brands);