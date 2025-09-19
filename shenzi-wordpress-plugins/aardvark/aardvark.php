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
        $this->create_zen_plugins_oasis_table();
        $this->populate_initial_shenzi_plugins();
    }
    
    /**
     * Create the wp_zen_plugins_oasis database table
     */
    private function create_zen_plugins_oasis_table() {
        global $wpdb;
        
        $table_name = $wpdb->prefix . 'zen_plugins_oasis';
        
        $charset_collate = $wpdb->get_charset_collate();
        
        $sql = "CREATE TABLE $table_name (
            id INT AUTO_INCREMENT PRIMARY KEY,
            plugin_slug VARCHAR(255) NOT NULL UNIQUE,
            plugin_path VARCHAR(255) NOT NULL,
            github_url VARCHAR(500),
            branch_name VARCHAR(100) DEFAULT 'main',
            github_token VARCHAR(255),
            auto_update TINYINT(1) DEFAULT 0,
            last_checked DATETIME,
            remote_version VARCHAR(50),
            install_status ENUM('installed', 'available', 'error') DEFAULT 'available',
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            
            INDEX idx_plugin_slug (plugin_slug),
            INDEX idx_install_status (install_status)
        ) $charset_collate;";
        
        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        dbDelta($sql);
    }
    
    /**
     * Populate initial shenzi plugins data
     */
    private function populate_initial_shenzi_plugins() {
        global $wpdb;
        
        $table_name = $wpdb->prefix . 'zen_plugins_oasis';
        
        $shenzi_plugins = array(
            array(
                'plugin_slug' => 'aardvark',
                'plugin_path' => 'aardvark/aardvark.php',
                'github_url' => 'https://github.com/transatlanticvoyage/aardvark.git',
                'branch_name' => 'main'
            ),
            array(
                'plugin_slug' => 'grove',
                'plugin_path' => 'grove-wp-plugin/grove.php',
                'github_url' => 'https://github.com/transatlanticvoyage/grove-wp-plugin.git',
                'branch_name' => 'main'
            ),
            array(
                'plugin_slug' => 'lumora',
                'plugin_path' => 'lumora/lumora.php',
                'github_url' => 'https://github.com/transatlanticvoyage/lumora.git',
                'branch_name' => 'main'
            ),
            array(
                'plugin_slug' => 'ruplin',
                'plugin_path' => 'ruplin/ruplin.php',
                'github_url' => 'https://github.com/transatlanticvoyage/ruplin.git',
                'branch_name' => 'main'
            ),
            array(
                'plugin_slug' => 'beacon',
                'plugin_path' => 'beacon/beacon.php',
                'github_url' => 'https://github.com/transatlanticvoyage/beacon.git',
                'branch_name' => 'main'
            ),
            array(
                'plugin_slug' => 'veyra',
                'plugin_path' => 'veyra/veyra.php',
                'github_url' => 'https://github.com/transatlanticvoyage/veyra.git',
                'branch_name' => 'main'
            ),
            array(
                'plugin_slug' => 'harbor',
                'plugin_path' => 'harbor/harbor.php',
                'github_url' => 'https://github.com/transatlanticvoyage/harbor.git',
                'branch_name' => 'main'
            ),
            array(
                'plugin_slug' => 'klyra',
                'plugin_path' => 'klyra/klyra.php',
                'github_url' => 'https://github.com/transatlanticvoyage/klyra.git',
                'branch_name' => 'main'
            )
        );
        
        foreach ($shenzi_plugins as $plugin) {
            $wpdb->replace(
                $table_name,
                $plugin,
                array('%s', '%s', '%s', '%s')
            );
        }
    }
    
    public function deactivate() {
        // Deactivation logic here
    }
}

// Initialize the plugin
new AardvarkPlugin();