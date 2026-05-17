<?php
require_once __DIR__ . '/../cors.php';

$conn = new mysqli("localhost","root","","store");
$sql = "
SELECT 
  c.categories_id AS id,
  c.categories_name AS name,
  c.categories_active AS is_active,
  c.company_id,

  COUNT(p.product_id) AS itemCount,
  COALESCE(SUM(p.quantity),0) AS totalStock,
  COALESCE(SUM(p.quantity * p.rate),0) AS totalValue,

  -- 🔥 KEY PART: attach products as JSON array
  JSON_ARRAYAGG(
    JSON_OBJECT(
      'id', p.product_id,
      'name', p.product_name,
      'rate', p.rate,
      'quantity', p.quantity
    )
  ) AS products

FROM categories c
LEFT JOIN product p 
  ON p.categories_id = c.categories_id 
  AND p.status = 1
GROUP BY 
  c.categories_id, 
  c.categories_name, 
  c.categories_active, 
  c.company_id
ORDER BY itemCount DESC
";

$res = $conn->query($sql);

$cats = [];
while ($r = $res->fetch_assoc()) {

  // decode products JSON so React gets clean array
  $r['products'] = $r['products'] ? json_decode($r['products'], true) : [];

  $cats[] = $r;
}

echo json_encode($cats);
