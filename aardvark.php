<?php
/**
 * Plugin Name: Aardvark
 * Plugin URI: https://github.com/yourusername/aardvark-wp-plugin
 * Description: Aardvark WordPress plugin
 * Version: 1.0.0
 * Author: Aardvark Team
 * License: GPL v2 or later
 * Text Domain: aardvark
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Define plugin constants
define('AARDVARK_PLUGIN_VERSION', '1.0.0');
define('AARDVARK_PLUGIN_PATH', plugin_dir_path(__FILE__));
define('AARDVARK_PLUGIN_URL', plugin_dir_url(__FILE__));

// Main plugin class
class AardvarkPlugin {
    
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
        require_once AARDVARK_PLUGIN_PATH . 'includes/class-aardvark-admin.php';
    }
    
    private function init_hooks() {
        new Aardvark_Admin();
    }
    
    public function activate() {
        // Activation logic here
    }
    
    public function deactivate() {
        // Deactivation logic here
    }
}

// Initialize the plugin
new AardvarkPlugin();