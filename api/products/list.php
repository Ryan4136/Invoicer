<?php
require_once __DIR__ . '/../cors.php';

$conn = new mysqli("localhost", "root", "", "store");

$sql = "
SELECT 
  product_id as id,
  product_name as name,
  '' as code,
  '' as barcode,
  hsn as hsn_code,
  categories_id as category,
  brand_id as brand,
  'PCS' as unit,
  0 as purchase_price,
  rate as sale_price,
  mrp,
  gst_rate,
  quantity as current_stock,
  0 as reorder_level,
  0 as opening_stock,
  1 as is_active,
  0 as is_service
FROM product
WHERE status = 1
";

$result = $conn->query($sql);

$items = [];
while ($row = $result->fetch_assoc()) {
  $items[] = $row;
}

echo json_encode($items);
