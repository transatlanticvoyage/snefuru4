-- Add k_root_domain column to zhe_serp_results table
ALTER TABLE zhe_serp_results 
ADD COLUMN IF NOT EXISTS k_root_domain TEXT;

-- Add comment to explain the column purpose
COMMENT ON COLUMN zhe_serp_results.k_root_domain IS 'Root domain extracted from the domain field, removing all subdomains (e.g., www.example.com becomes example.com)';