-- Test data for ketch_settings table
-- Part 1 implementation: Switch WordPress plugin to use ketch_settings instead of ketch_width_settings

-- Clear any existing test data
DELETE FROM ketch_settings WHERE app_page IN ('zephyr_test', 'quixon_demo', 'flarnyx_sandbox');

-- Insert test settings for demonstration with idiosyncratic names
INSERT INTO ketch_settings (
    app_page, 
    ancestor_element, 
    element_tag, 
    id, 
    class, 
    width, 
    min_width, 
    max_width, 
    height, 
    min_height, 
    max_height
) VALUES 
-- Zephyr test page styles
('zephyr_test', '', 'div', '', 'blarnook_wrapper', '95%', '', '1400px', '', '', ''),
('zephyr_test', '', 'section', 'quibble_main', '', '100%', '300px', '', '250px', '200px', '350px'),
('zephyr_test', '.blarnook_wrapper', 'span', '', 'flizz_indicator', '80px', '60px', '120px', '40px', '', ''),

-- Quixon demo page styles  
('quixon_demo', '', 'div', '', 'snizzle_container', '88%', '400px', '900px', '', '', ''),
('quixon_demo', '', 'article', 'plonk_feature', '', '100%', '', '700px', '180px', '150px', '220px'),
('quixon_demo', '.snizzle_container', 'img', '', 'whizbang_graphic', '100%', '', '450px', '120px', '', '200px'),

-- Flarnyx sandbox page styles
('flarnyx_sandbox', '', 'div', '', 'gribble_zone', '92%', '350px', '800px', '', '', ''),
('flarnyx_sandbox', '', 'nav', 'zoonk_menu', '', '100%', '200px', '300px', '60px', '40px', '80px'),
('flarnyx_sandbox', '.gribble_zone', 'p', '', 'blizzard_text', '100%', '', '', '', '30px', '');

-- Show inserted data
SELECT 
    app_page,
    element_tag,
    COALESCE(id, '') as id,
    COALESCE(class, '') as class,
    COALESCE(width, '') as width,
    COALESCE(height, '') as height
FROM ketch_settings 
ORDER BY app_page, element_tag, class;