<?php
/**
 * Test script to verify Petrifact implementation
 * 
 * This script simulates WordPress environment to test Petrifact classes
 */

// Mock WordPress functions for testing
if (!function_exists('wp_mkdir_p')) {
    function wp_mkdir_p($path) {
        return mkdir($path, 0755, true);
    }
}

if (!function_exists('current_time')) {
    function current_time($format) {
        return date($format);
    }
}

if (!function_exists('get_option')) {
    function get_option($option, $default = false) {
        // Mock options for testing
        static $options = array(
            'petrifact_runtime_version' => '0.0.0'
        );
        return isset($options[$option]) ? $options[$option] : $default;
    }
}

if (!function_exists('update_option')) {
    function update_option($option, $value) {
        return true;
    }
}

if (!defined('WP_CONTENT_DIR')) {
    define('WP_CONTENT_DIR', '/tmp/wp-content-test');
}

// Load Petrifact classes
require_once 'snefuruplin/includes/petrifact/class-petrifact-registry.php';
require_once 'snefuruplin/includes/petrifact/class-petrifact-generator.php';

echo "=== Petrifact Implementation Test ===\n\n";

// Test 1: Registry Class
echo "1. Testing Petrifact Registry...\n";
$shortcodes = Petrifact_Registry::get_persistent_shortcodes();
echo "   Found " . count($shortcodes) . " persistent shortcodes:\n";
foreach (array_keys($shortcodes) as $shortcode) {
    echo "   - [$shortcode]\n";
}

$tables = Petrifact_Registry::get_persistent_tables();
echo "   Found " . count($tables) . " persistent tables:\n";
foreach (array_keys($tables) as $table) {
    echo "   - $table\n";
}

echo "   Registry version: " . Petrifact_Registry::get_version() . "\n";
echo "   Needs update: " . (Petrifact_Registry::needs_update() ? 'YES' : 'NO') . "\n\n";

// Test 2: Generator Class
echo "2. Testing Petrifact Generator...\n";

// Create test directory
if (!is_dir(WP_CONTENT_DIR)) {
    wp_mkdir_p(WP_CONTENT_DIR . '/mu-plugins');
}

echo "   Test directory created: " . WP_CONTENT_DIR . "\n";
echo "   Generator class loaded successfully\n";

// Test validation method
$validation = Petrifact_Generator::validate_installation();
echo "   Validation results:\n";
echo "   - MU file exists: " . ($validation['mu_file_exists'] ? 'YES' : 'NO') . "\n";
echo "   - Version match: " . ($validation['version_match'] ? 'YES' : 'NO') . "\n";
echo "   - Tables exist: " . count($validation['tables_exist']) . " checked\n";

echo "\n=== Test Complete ===\n";
echo "All classes loaded successfully without syntax errors!\n";