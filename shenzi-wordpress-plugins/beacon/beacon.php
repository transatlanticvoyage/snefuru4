<?php
// TEST COMMENT - Testing git tracking in both repos
/**
 * Plugin Name: Beacon
 * Plugin URI: https://github.com/transatlanticvoyage/beacon-wp-plugin
 * Description: Beacon - WordPress plugin for zen data fallback and shortcode management
 * Version: 1.1.0
 * Author: Beacon Team
 * License: GPL v2 or later
 * Text Domain: beacon
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Define plugin constants
define('BEACON_PLUGIN_VERSION', '1.1.0');
define('BEACON_PLUGIN_PATH', plugin_dir_path(__FILE__));
define('BEACON_PLUGIN_URL', plugin_dir_url(__FILE__));

// Main plugin class
class BeaconPlugin {
    
    public function __construct() {
        add_action('init', array($this, 'init'));
        register_activation_hook(__FILE__, array($this, 'activate'));
        register_deactivation_hook(__FILE__, array($this, 'deactivate'));
    }
    
    public function init() {
        $this->load_dependencies();
        $this->init_hooks();
    }
    
    private function load_dependencies() {
        require_once BEACON_PLUGIN_PATH . 'includes/class-beacon-admin.php';
        require_once BEACON_PLUGIN_PATH . 'includes/class-beacon-tax-exports.php';
        require_once BEACON_PLUGIN_PATH . 'includes/class-beacon-zen-shortcodes.php';
        require_once BEACON_PLUGIN_PATH . 'includes/class-beacon-database.php';
    }
    
    private function init_hooks() {
        new Beacon_Admin();
        new Beacon_Zen_Shortcodes();
        new Beacon_Database();
    }
    
    public function activate() {
        // Create database tables
        require_once BEACON_PLUGIN_PATH . 'includes/class-beacon-database.php';
        $database = new Beacon_Database();
        $database->on_activation();
        
        // Set default shortcode mode if not already set
        if (!get_option('beacon_shortcode_mode')) {
            add_option('beacon_shortcode_mode', 'automatic');
        }
    }
    
    public function deactivate() {
        // Plugin deactivation tasks  
    }
}

// Initialize the plugin
new BeaconPlugin();