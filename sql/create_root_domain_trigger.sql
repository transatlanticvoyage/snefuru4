-- Create a function to extract root domain from a full domain
CREATE OR REPLACE FUNCTION extract_root_domain(full_domain TEXT)
RETURNS TEXT AS $$
DECLARE
    domain_parts TEXT[];
    num_parts INTEGER;
    result TEXT;
BEGIN
    -- Handle null or empty input
    IF full_domain IS NULL OR full_domain = '' THEN
        RETURN NULL;
    END IF;
    
    -- Convert to lowercase for consistency
    full_domain := LOWER(TRIM(full_domain));
    
    -- Split domain by dots
    domain_parts := string_to_array(full_domain, '.');
    num_parts := array_length(domain_parts, 1);
    
    -- Handle invalid domains
    IF num_parts < 2 THEN
        RETURN full_domain;
    END IF;
    
    -- Check for known multi-part TLDs
    -- This list covers the most common multi-part TLDs
    IF num_parts >= 3 THEN
        -- Check for common two-part TLDs
        IF (domain_parts[num_parts-1] || '.' || domain_parts[num_parts]) IN (
            'co.uk', 'co.nz', 'co.za', 'co.in', 'co.jp', 'co.kr', 'co.th', 'co.id',
            'com.au', 'com.br', 'com.cn', 'com.mx', 'com.tw', 'com.ar', 'com.sg',
            'net.au', 'net.br', 'net.cn', 'net.mx', 'net.tw', 'net.ar', 'net.nz',
            'org.uk', 'org.au', 'org.nz', 'org.br', 'org.cn', 'org.mx', 'org.tw',
            'gov.uk', 'gov.au', 'gov.br', 'gov.cn', 'gov.in', 'gov.sg', 'gov.za',
            'ac.uk', 'ac.nz', 'ac.za', 'ac.jp', 'ac.in', 'ac.kr', 'ac.th',
            'edu.au', 'edu.br', 'edu.cn', 'edu.mx', 'edu.sg', 'edu.tw', 'edu.in',
            'or.jp', 'ne.jp', 'gr.jp', 'go.jp', 'ac.jp', 'ad.jp', 'ed.jp', 'lg.jp',
            'me.uk', 'ltd.uk', 'plc.uk', 'sch.uk', 'nhs.uk', 'mil.uk', 'nic.uk',
            'asn.au', 'id.au', 'info.au', 'conf.au', 'oz.au', 'act.au', 'nsw.au',
            'nt.au', 'qld.au', 'sa.au', 'tas.au', 'vic.au', 'wa.au'
        ) THEN
            -- Return domain with two-part TLD (third-to-last . second-to-last . last)
            result := domain_parts[num_parts-2] || '.' || domain_parts[num_parts-1] || '.' || domain_parts[num_parts];
        ELSE
            -- Standard TLD, return last two parts
            result := domain_parts[num_parts-1] || '.' || domain_parts[num_parts];
        END IF;
    ELSE
        -- Only 2 parts, return as is
        result := full_domain;
    END IF;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create a trigger function to automatically populate k_root_domain
CREATE OR REPLACE FUNCTION update_root_domain_trigger()
RETURNS TRIGGER AS $$
BEGIN
    -- Only update if domain field has a value
    IF NEW.domain IS NOT NULL AND NEW.domain != '' THEN
        NEW.k_root_domain := extract_root_domain(NEW.domain);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for INSERT operations
DROP TRIGGER IF EXISTS zhe_serp_results_insert_root_domain ON zhe_serp_results;
CREATE TRIGGER zhe_serp_results_insert_root_domain
    BEFORE INSERT ON zhe_serp_results
    FOR EACH ROW
    EXECUTE FUNCTION update_root_domain_trigger();

-- Create trigger for UPDATE operations (when domain changes)
DROP TRIGGER IF EXISTS zhe_serp_results_update_root_domain ON zhe_serp_results;
CREATE TRIGGER zhe_serp_results_update_root_domain
    BEFORE UPDATE OF domain ON zhe_serp_results
    FOR EACH ROW
    WHEN (NEW.domain IS DISTINCT FROM OLD.domain)
    EXECUTE FUNCTION update_root_domain_trigger();

-- Update existing records to populate k_root_domain
UPDATE zhe_serp_results 
SET k_root_domain = extract_root_domain(domain)
WHERE domain IS NOT NULL AND domain != '' AND k_root_domain IS NULL;

-- Test the function with some examples
SELECT 
    'www.dogs.com' as input,
    extract_root_domain('www.dogs.com') as output
UNION ALL
SELECT 
    'parsons.jarls.cats.com' as input,
    extract_root_domain('parsons.jarls.cats.com') as output
UNION ALL
SELECT 
    'www.example.co.uk' as input,
    extract_root_domain('www.example.co.uk') as output
UNION ALL
SELECT 
    'subdomain.test.co.nz' as input,
    extract_root_domain('subdomain.test.co.nz') as output
UNION ALL
SELECT 
    'deep.sub.domain.example.com.au' as input,
    extract_root_domain('deep.sub.domain.example.com.au') as output;