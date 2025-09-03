-- Create unified view joining sitespren, sitesglub, and sitesdfs tables
-- This view enables the expanded table functionality with all columns from the three tables

CREATE OR REPLACE VIEW sitespren_unified_view AS
SELECT 
  -- All existing sitespren columns
  s.*,
  
  -- Existing joined columns from sitespren_large_view_1
  slv.registrar_username,
  slv.registrar_company_id,
  slv.registrar_company_name,
  slv.registrar_portal_url,
  
  -- All sitesglub columns (in original table definition order)
  sg.sitesglub_id,
  sg.sitesglub_base AS glub_sitesglub_base,
  sg.ns_full AS glub_ns_full,
  sg.ip_address AS glub_ip_address,
  sg.mj_tf,
  sg.mj_cf,
  sg.mj_rd,
  sg.mj_refips,
  sg.mj_refsubnets,
  sg.mj_bl,
  sg.fk_sitesdfs_id,
  sg.created_at AS glub_created_at,
  sg.updated_at AS glub_updated_at,
  
  -- All sitesdfs columns (in original table definition order)
  sd.sitesdfs_id,
  sd.sitesdfs_base AS dfs_sitesdfs_base,
  sd.domain AS dfs_domain,
  sd.created_datetime AS dfs_created_datetime,
  sd.changed_datetime AS dfs_changed_datetime,
  sd.expiration_datetime AS dfs_expiration_datetime,
  sd.updated_datetime AS dfs_updated_datetime,
  sd.first_seen AS dfs_first_seen,
  sd.tld AS dfs_tld,
  sd.registered AS dfs_registered,
  sd.registrar AS dfs_registrar,
  sd.epp_status_codes AS dfs_epp_status_codes,
  sd.raw_status_codes AS dfs_raw_status_codes,
  sd.organic_pos_1,
  sd.organic_pos_2_3,
  sd.organic_pos_4_10,
  sd.organic_pos_11_20,
  sd.organic_pos_21_30,
  sd.organic_pos_31_40,
  sd.organic_pos_41_50,
  sd.organic_pos_51_60,
  sd.organic_pos_61_70,
  sd.organic_pos_71_80,
  sd.organic_pos_81_90,
  sd.organic_pos_91_100,
  sd.organic_etv,
  sd.organic_estimated_paid_traffic_cost,
  sd.paid_pos_1,
  sd.paid_pos_2_3,
  sd.paid_pos_4_10,
  sd.paid_pos_11_20,
  sd.paid_pos_21_30,
  sd.paid_pos_31_40,
  sd.paid_pos_41_50,
  sd.paid_pos_51_60,
  sd.paid_pos_61_70,
  sd.paid_pos_71_80,
  sd.paid_pos_81_90,
  sd.paid_pos_91_100,
  sd.paid_etv,
  sd.paid_estimated_paid_traffic_cost,
  sd.referring_domains,
  sd.referring_main_domains,
  sd.referring_pages,
  sd.backlinks,
  sd.backlinks_spam_score,
  sd.broken_backlinks,
  sd.broken_pages,
  sd.referring_domains_nofollow,
  sd.referring_main_domains_nofollow,
  sd.referring_ips,
  sd.referring_subnets,
  sd.referring_pages_nofollow,
  sd.metrics_time_update AS dfs_metrics_time_update,
  sd.se_type AS dfs_se_type,
  sd.location_code AS dfs_location_code,
  sd.language_code AS dfs_language_code,
  sd.created_at AS dfs_created_at,
  sd.updated_at AS dfs_updated_at

FROM sitespren s
LEFT JOIN sitespren_large_view_1 slv ON s.id = slv.id
LEFT JOIN sitesglub sg ON s.sitespren_base = sg.sitesglub_base
LEFT JOIN sitesdfs sd ON sg.fk_sitesdfs_id = sd.sitesdfs_id;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sitesglub_base_lookup ON sitesglub(sitesglub_base);
CREATE INDEX IF NOT EXISTS idx_sitesdfs_fk_lookup ON sitesdfs(sitesdfs_id);
CREATE INDEX IF NOT EXISTS idx_sitesglub_fk_sitesdfs ON sitesglub(fk_sitesdfs_id);

COMMENT ON VIEW sitespren_unified_view IS 
'Unified view combining sitespren, sitesglub, and sitesdfs data for expanded table functionality in /sitejar4 page. 
Uses LEFT JOINs to ensure all sitespren records are included even if they lack corresponding sitesglub or sitesdfs data.';