-- Debug WordPress Permissions Issues
-- Run these queries in Supabase SQL Editor to identify the problematic WordPress setup

-- 1. Find all domains with WordPress credentials
SELECT 
  d.id,
  d.domain_base,
  d.wpuser1,
  d.wppass1,
  d.wp_plugin_installed1,
  d.wp_plugin_connected2,
  d.created_at
FROM domains1 d
WHERE d.wpuser1 IS NOT NULL 
   OR d.wppass1 IS NOT NULL
ORDER BY d.created_at DESC;

-- 2. Find batches that have been used with sfunc_63_push_images recently
SELECT 
  b.id as batch_id,
  b.fk_domains_id,
  d.domain_base,
  d.wpuser1,
  d.wp_plugin_installed1,
  d.wp_plugin_connected2,
  b.created_at as batch_created,
  b.updated_at as batch_updated
FROM images_plans_batches b
LEFT JOIN domains1 d ON b.fk_domains_id = d.id
WHERE b.fk_domains_id IS NOT NULL
ORDER BY b.updated_at DESC
LIMIT 10;

-- 3. Find any recent narpi_pushes records (these are created by sfunc_63)
SELECT 
  np.id,
  np.push_name,
  np.push_desc,
  np.push_status1,
  np.fk_batch_id,
  np.created_at,
  b.fk_domains_id,
  d.domain_base,
  d.wpuser1
FROM narpi_pushes np
LEFT JOIN images_plans_batches b ON np.fk_batch_id = b.id
LEFT JOIN domains1 d ON b.fk_domains_id = d.id
ORDER BY np.created_at DESC
LIMIT 10;

-- 4. Check for batches that might be missing domain associations
SELECT 
  b.id as batch_id,
  b.fk_domains_id,
  b.created_at,
  CASE 
    WHEN b.fk_domains_id IS NULL THEN 'No domain assigned'
    ELSE 'Domain assigned'
  END as domain_status
FROM images_plans_batches b
ORDER BY b.created_at DESC
LIMIT 10; 