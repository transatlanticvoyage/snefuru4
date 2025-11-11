<?php
/**
 * Helper Functions File
 * Contains reusable functions for the site
 */

/**
 * Generate a URL with the dynamic site root path
 * @param string $path The path relative to the site root (e.g., 'services/roof-repair')
 * @return string The full URL with the site root prepended
 */
function site_url($path = '') {
    // Get the site root from the constant if available, otherwise from config
    $root = defined('SITE_ROOT') ? SITE_ROOT : (isset($GLOBALS['site_config']['site_root']) ? $GLOBALS['site_config']['site_root'] : '/');
    
    // Remove leading slash from path if present
    $path = ltrim($path, '/');
    
    // Return the combined URL
    return $root . $path;
}

/**
 * Get the current page slug from URL
 * @return string The current page slug
 */
function get_current_page_slug() {
    $current_url = $_SERVER['REQUEST_URI'];
    $url_parts = explode('/', trim($current_url, '/'));
    return end($url_parts) ?: 'index';
}

/**
 * Check if current page matches the given page name
 * @param string $page_name The page name to check
 * @return bool True if current page matches
 */
function is_current_page($page_name) {
    $current_page = isset($GLOBALS['page_data']['current_page']) ? $GLOBALS['page_data']['current_page'] : '';
    return $current_page === $page_name;
}

/**
 * Generate meta tags for SEO
 * @param array $meta_data Array containing title, description, keywords
 * @return string HTML meta tags
 */
function generate_meta_tags($meta_data) {
    $output = '';
    
    if (isset($meta_data['title'])) {
        $output .= '<meta property="og:title" content="' . htmlspecialchars($meta_data['title']) . '">' . "\n";
        $output .= '<meta name="twitter:title" content="' . htmlspecialchars($meta_data['title']) . '">' . "\n";
    }
    
    if (isset($meta_data['description'])) {
        $output .= '<meta property="og:description" content="' . htmlspecialchars($meta_data['description']) . '">' . "\n";
        $output .= '<meta name="twitter:description" content="' . htmlspecialchars($meta_data['description']) . '">' . "\n";
    }
    
    return $output;
}

/**
 * Format phone number for display
 * @param string $phone The phone number
 * @return string Formatted phone number
 */
function format_phone($phone) {
    $clean = preg_replace('/[^0-9]/', '', $phone);
    if (strlen($clean) == 10) {
        return '(' . substr($clean, 0, 3) . ') ' . substr($clean, 3, 3) . '-' . substr($clean, 6);
    }
    return $phone;
}

/**
 * Generate breadcrumbs
 * @param array $breadcrumbs Array of breadcrumb items
 * @return string HTML breadcrumb markup
 */
function generate_breadcrumbs($breadcrumbs) {
    if (empty($breadcrumbs)) {
        return '';
    }
    
    $output = '<nav class="breadcrumbs text-sm text-gray-600 mb-4">';
    $output .= '<ol class="flex items-center space-x-2">';
    
    foreach ($breadcrumbs as $index => $crumb) {
        if ($index > 0) {
            $output .= '<li class="flex items-center">';
            $output .= '<i class="fas fa-chevron-right text-gray-400 mx-2"></i>';
        } else {
            $output .= '<li class="flex items-center">';
        }
        
        if (isset($crumb['url']) && $index < count($breadcrumbs) - 1) {
            $output .= '<a href="' . htmlspecialchars($crumb['url']) . '" class="hover:text-blue-600">';
            $output .= htmlspecialchars($crumb['label']);
            $output .= '</a>';
        } else {
            $output .= '<span class="text-gray-900 font-medium">' . htmlspecialchars($crumb['label']) . '</span>';
        }
        
        $output .= '</li>';
    }
    
    $output .= '</ol>';
    $output .= '</nav>';
    
    return $output;
}

/**
 * Truncate text to specified length
 * @param string $text The text to truncate
 * @param int $length Maximum length
 * @param string $suffix Suffix to add if truncated
 * @return string Truncated text
 */
function truncate_text($text, $length = 150, $suffix = '...') {
    if (strlen($text) <= $length) {
        return $text;
    }
    
    $truncated = substr($text, 0, $length);
    $last_space = strrpos($truncated, ' ');
    
    if ($last_space !== false) {
        $truncated = substr($truncated, 0, $last_space);
    }
    
    return $truncated . $suffix;
}

/**
 * Get service by slug
 * @param string $slug The service slug
 * @return array|null Service data or null if not found
 */
function get_service_by_slug($slug) {
    global $site_config;
    
    foreach ($site_config['services'] as $service) {
        if ($service['slug'] === $slug) {
            return $service;
        }
    }
    
    return null;
}

/**
 * Get area by slug
 * @param string $slug The area slug
 * @return array|null Area data or null if not found
 */
function get_area_by_slug($slug) {
    global $site_config;
    
    foreach ($site_config['areas'] as $area) {
        if ($area['slug'] === $slug) {
            return $area;
        }
    }
    
    return null;
}

/**
 * Generate schema.org JSON-LD for a page
 * @param string $type The schema type (Article, Service, etc.)
 * @param array $data The data for the schema
 * @return string JSON-LD script tag
 */
function generate_schema($type, $data) {
    $schema = [
        '@context' => 'https://schema.org',
        '@type' => $type
    ];
    
    $schema = array_merge($schema, $data);
    
    return '<script type="application/ld+json">' . "\n" . json_encode($schema, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . "\n" . '</script>';
}

/**
 * Check if file exists and include it
 * @param string $file_path The file path to include
 * @return bool True if included successfully
 */
function safe_include($file_path) {
    if (file_exists($file_path)) {
        include $file_path;
        return true;
    }
    return false;
}