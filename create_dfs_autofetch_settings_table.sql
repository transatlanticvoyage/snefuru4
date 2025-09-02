-- Create the admin settings table for DFS autofetch column management
CREATE TABLE dfs_autofetch_settings (
    id SERIAL PRIMARY KEY,
    column_name TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    category TEXT NOT NULL, -- 'domain', 'organic', 'paid', 'backlinks', 'metadata'
    description TEXT,
    is_enabled BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert all available sitesdfs columns with their metadata
INSERT INTO dfs_autofetch_settings (column_name, display_name, category, description, sort_order) VALUES
-- Domain Fields
('domain', 'Domain Name', 'domain', 'The domain name from DataForSEO', 1),
('created_datetime', 'Domain Created', 'domain', 'Domain registration date', 2),
('changed_datetime', 'Domain Changed', 'domain', 'Domain last modification date', 3),
('expiration_datetime', 'Domain Expires', 'domain', 'Domain expiration date', 4),
('updated_datetime', 'Domain Updated', 'domain', 'Domain last update date', 5),
('first_seen', 'First Seen', 'domain', 'First time crawler discovered domain', 6),
('tld', 'Top Level Domain', 'domain', 'TLD (.com, .org, etc.)', 7),
('registered', 'Is Registered', 'domain', 'Domain registration status', 8),
('registrar', 'Registrar', 'domain', 'Domain registrar name', 9),
('epp_status_codes', 'EPP Status Codes', 'domain', 'EPP status codes array', 10),
('raw_status_codes', 'Raw Status Codes', 'domain', 'Raw status codes from whois', 11),

-- Organic Search Metrics
('organic_pos_1', 'Organic Position 1', 'organic', 'Keywords ranking in position 1', 20),
('organic_pos_2_3', 'Organic Positions 2-3', 'organic', 'Keywords ranking in positions 2-3', 21),
('organic_pos_4_10', 'Organic Positions 4-10', 'organic', 'Keywords ranking in positions 4-10', 22),
('organic_pos_11_20', 'Organic Positions 11-20', 'organic', 'Keywords ranking in positions 11-20', 23),
('organic_pos_21_30', 'Organic Positions 21-30', 'organic', 'Keywords ranking in positions 21-30', 24),
('organic_pos_31_40', 'Organic Positions 31-40', 'organic', 'Keywords ranking in positions 31-40', 25),
('organic_pos_41_50', 'Organic Positions 41-50', 'organic', 'Keywords ranking in positions 41-50', 26),
('organic_pos_51_60', 'Organic Positions 51-60', 'organic', 'Keywords ranking in positions 51-60', 27),
('organic_pos_61_70', 'Organic Positions 61-70', 'organic', 'Keywords ranking in positions 61-70', 28),
('organic_pos_71_80', 'Organic Positions 71-80', 'organic', 'Keywords ranking in positions 71-80', 29),
('organic_pos_81_90', 'Organic Positions 81-90', 'organic', 'Keywords ranking in positions 81-90', 30),
('organic_pos_91_100', 'Organic Positions 91-100', 'organic', 'Keywords ranking in positions 91-100', 31),
('organic_etv', 'Organic ETV', 'organic', 'Estimated Traffic Volume from organic search', 32),
('organic_estimated_paid_traffic_cost', 'Organic Paid Traffic Cost', 'organic', 'Estimated cost for equivalent paid traffic', 33),

-- Paid Search Metrics
('paid_pos_1', 'Paid Position 1', 'paid', 'Paid ads ranking in position 1', 40),
('paid_pos_2_3', 'Paid Positions 2-3', 'paid', 'Paid ads ranking in positions 2-3', 41),
('paid_pos_4_10', 'Paid Positions 4-10', 'paid', 'Paid ads ranking in positions 4-10', 42),
('paid_pos_11_20', 'Paid Positions 11-20', 'paid', 'Paid ads ranking in positions 11-20', 43),
('paid_pos_21_30', 'Paid Positions 21-30', 'paid', 'Paid ads ranking in positions 21-30', 44),
('paid_pos_31_40', 'Paid Positions 31-40', 'paid', 'Paid ads ranking in positions 31-40', 45),
('paid_pos_41_50', 'Paid Positions 41-50', 'paid', 'Paid ads ranking in positions 41-50', 46),
('paid_pos_51_60', 'Paid Positions 51-60', 'paid', 'Paid ads ranking in positions 51-60', 47),
('paid_pos_61_70', 'Paid Positions 61-70', 'paid', 'Paid ads ranking in positions 61-70', 48),
('paid_pos_71_80', 'Paid Positions 71-80', 'paid', 'Paid ads ranking in positions 71-80', 49),
('paid_pos_81_90', 'Paid Positions 81-90', 'paid', 'Paid ads ranking in positions 81-90', 50),
('paid_pos_91_100', 'Paid Positions 91-100', 'paid', 'Paid ads ranking in positions 91-100', 51),
('paid_etv', 'Paid ETV', 'paid', 'Estimated Traffic Volume from paid search', 52),
('paid_estimated_paid_traffic_cost', 'Paid Traffic Cost', 'paid', 'Estimated paid traffic cost', 53),

-- Backlinks Data
('referring_domains', 'Referring Domains', 'backlinks', 'Number of unique referring domains', 60),
('referring_main_domains', 'Referring Main Domains', 'backlinks', 'Number of main referring domains', 61),
('referring_pages', 'Referring Pages', 'backlinks', 'Total referring pages', 62),
('backlinks', 'Total Backlinks', 'backlinks', 'Total backlinks count', 63),
('backlinks_spam_score', 'Backlinks Spam Score', 'backlinks', 'Backlinks spam score', 64),
('broken_backlinks', 'Broken Backlinks', 'backlinks', 'Number of broken backlinks', 65),
('broken_pages', 'Broken Pages', 'backlinks', 'Number of broken pages', 66),
('referring_domains_nofollow', 'Nofollow Referring Domains', 'backlinks', 'Nofollow referring domains', 67),
('referring_main_domains_nofollow', 'Nofollow Main Domains', 'backlinks', 'Nofollow main referring domains', 68),
('referring_ips', 'Referring IPs', 'backlinks', 'Number of referring IP addresses', 69),
('referring_subnets', 'Referring Subnets', 'backlinks', 'Number of referring subnets', 70),
('referring_pages_nofollow', 'Nofollow Referring Pages', 'backlinks', 'Nofollow referring pages', 71),

-- Metadata
('metrics_time_update', 'Metrics Time Update', 'metadata', 'When metrics were last updated', 80),
('se_type', 'Search Engine Type', 'metadata', 'Search engine type (google)', 81),
('location_code', 'Location Code', 'metadata', 'Geographic location code', 82),
('language_code', 'Language Code', 'metadata', 'Language code (en)', 83);

-- Create trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_dfs_autofetch_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_dfs_autofetch_settings_updated_at
    BEFORE UPDATE ON dfs_autofetch_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_dfs_autofetch_settings_updated_at();

-- Create index for better performance
CREATE INDEX idx_dfs_autofetch_settings_category ON dfs_autofetch_settings(category);
CREATE INDEX idx_dfs_autofetch_settings_enabled ON dfs_autofetch_settings(is_enabled);