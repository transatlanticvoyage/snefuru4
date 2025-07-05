-- Test data for ketch_settings table
-- Part 1 implementation: Switch WordPress plugin to use ketch_settings instead of ketch_width_settings

-- Clear any existing test data
DELETE FROM ketch_settings WHERE app_page IN ('home', 'about', 'global');

-- Insert test settings for demonstration
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
-- Global styles
('global', '', 'body', '', '', '100%', '', '1200px', '', '', ''),
('global', '', 'div', '', 'container', '90%', '320px', '1200px', '', '', ''),
('global', '', 'div', '', 'header', '100%', '', '', '80px', '60px', '100px'),

-- Home page specific styles  
('home', '', 'div', '', 'hero-section', '100%', '', '', '400px', '300px', '600px'),
('home', '', 'div', '', 'hero-title', '80%', '300px', '800px', '', '', ''),
('home', '.hero-section', 'img', '', 'hero-image', '100%', '', '500px', '200px', '', '300px'),

-- About page specific styles
('about', '', 'div', '', 'content-wrapper', '85%', '320px', '900px', '', '', ''),
('about', '', 'div', '', 'sidebar', '25%', '200px', '300px', '', '400px', ''),
('about', '.content-wrapper', 'p', '', 'intro-text', '100%', '', '', '', '40px', '');

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