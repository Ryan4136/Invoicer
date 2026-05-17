<?php
require_once __DIR__ . "/../cors.php";
require_once __DIR__ . "/../db_connect.php";

$sql = "
SELECT 
  id,
  name,
  phone,
  gstin,
  state_code,
  customer_type,
  address,
  company_id,
  created_at
FROM customers
ORDER BY name ASC
";

$result = $connect->query($sql);

$customers = [];

while ($row = $result->fetch_assoc()) {
    $customers[] = [
        "id" => (int)$row["id"],
        "name" => $row["name"],
        "phone" => $row["phone"],
        "gstin" => $row["gstin"] ?? "",
        "state_code" => $row["state_code"],
        "type" => $row["customer_type"] ?? "customer",
        "address" => $row["address"],
        "created_at" => $row["created_at"]
    ];
}

echo json_encode(["data" => $customers]);