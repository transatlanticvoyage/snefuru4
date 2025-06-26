-- Create sitespren_large_view_1 with host_account and host_company joins
-- This view will include all sitespren columns plus registrar information

CREATE OR REPLACE VIEW sitespren_large_view_1 AS
SELECT 
    -- All original sitespren columns
    s.id,
    s.created_at,
    s.sitespren_base,
    s.ns_full,
    s.ip_address,
    s.true_root_domain,
    s.full_subdomain,
    s.webproperty_type,
    s.fk_users_id,
    s.updated_at,
    s.wpuser1,
    s.wppass1,
    s.ruplin_apikey,
    s.wp_rest_app_pass,
    s.wp_plugin_installed1,
    s.wp_plugin_connected2,
    s.fk_domreg_hostaccount,
    s.is_wp_site,
    s.is_starred1,
    
    -- Joined registrar information from host_account and host_company
    ha.username as registrar_username,
    hc.id as registrar_company_id,
    hc.name as registrar_company_name,
    hc.portal_url1 as registrar_portal_url
    
FROM sitespren s
LEFT JOIN host_account ha ON s.fk_domreg_hostaccount = ha.id
LEFT JOIN host_company hc ON ha.fk_host_company_id = hc.id;

-- Add comment for documentation
COMMENT ON VIEW sitespren_large_view_1 IS 'Comprehensive view of sitespren data with registrar information joined from host_account and host_company tables';