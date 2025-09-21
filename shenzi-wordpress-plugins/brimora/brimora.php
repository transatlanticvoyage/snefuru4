<?php
/**
 * Plugin Name: Brimora
 * Plugin URI: https://github.com/transatlanticvoyage/brimora
 * Description: Independent Elementor integration for zen database services - dynamic backgrounds and data binding
 * Version: 1.0.0
 * Author: Brimora Team
 * License: GPL v2 or later
 * Text Domain: brimora
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Define plugin constants
define('BRIMORA_PLUGIN_VERSION', '1.0.0');
define('BRIMORA_PLUGIN_PATH', plugin_dir_path(__FILE__));
define('BRIMORA_PLUGIN_URL', plugin_dir_url(__FILE__));
define('BRIMORA_PLUGIN_FILE', __FILE__);

// Main plugin class
class Brimora {
    
    private static $instance = null;
    
    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    public function __construct() {
        add_action('plugins_loaded', array($this, 'init'));
        register_activation_hook(__FILE__, array($this, 'activate'));
        register_deactivation_hook(__FILE__, array($this, 'deactivate'));
    }
    
    public function init() {
        // Check if Elementor is active
        if (!did_action('elementor/loaded')) {
            add_action('admin_notices', array($this, 'elementor_missing_notice'));
            return;
        }
        
        // Load dependencies
        $this->load_dependencies();
        
        // Initialize components
        $this->init_components();
    }
    
    private function load_dependencies() {
        require_once BRIMORA_PLUGIN_PATH . 'includes/class-brimora-database.php';
        require_once BRIMORA_PLUGIN_PATH . 'includes/class-brimora-elementor.php';
        require_once BRIMORA_PLUGIN_PATH . 'includes/class-brimora-background-handler.php';
        require_once BRIMORA_PLUGIN_PATH . 'includes/class-brimora-admin.php';
    }
    
    private function init_components() {
        // Initialize database handler
        new Brimora_Database();
        
        // Initialize Elementor integration
        new Brimora_Elementor();
        
        // Initialize background handler
        new Brimora_Background_Handler();
        
        // Initialize admin interface
        if (is_admin()) {
            new Brimora_Admin();
        }
        
        // Enqueue assets
        add_action('wp_enqueue_scripts', array($this, 'enqueue_scripts'));
        
        // Also enqueue in Elementor preview mode
        add_action('elementor/preview/enqueue_styles', array($this, 'enqueue_scripts'));
        add_action('elementor/editor/before_enqueue_scripts', array($this, 'enqueue_scripts'));
        
        // Add editor-specific scripts
        add_action('elementor/editor/after_enqueue_scripts', array($this, 'enqueue_editor_scripts'));
    }
    
    public function enqueue_scripts() {
        // Enqueue on both frontend and Elementor preview
        if (is_admin() && !wp_doing_ajax()) {
            return; // Don't load on admin pages except AJAX
        }
        
        wp_enqueue_script(
            'brimora-elementor',
            BRIMORA_PLUGIN_URL . 'assets/js/brimora-elementor.js',
            array('jquery'),
            BRIMORA_PLUGIN_VERSION,
            true
        );
        
        wp_localize_script('brimora-elementor', 'brimoraAjax', array(
            'ajaxUrl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('brimora_nonce')
        ));
        
        wp_enqueue_style(
            'brimora-elementor',
            BRIMORA_PLUGIN_URL . 'assets/css/brimora-elementor.css',
            array(),
            BRIMORA_PLUGIN_VERSION
        );
        
        // Add inline script for immediate testing
        wp_add_inline_script('brimora-elementor', '
            console.log("Brimora: Inline script executing");
            console.log("Brimora: Location:", window.location.href);
            console.log("Brimora: jQuery available:", typeof jQuery !== "undefined");
        ');
    }
    
    public function enqueue_editor_scripts() {
        // Script that runs in Elementor editor
        wp_enqueue_script(
            'brimora-editor',
            BRIMORA_PLUGIN_URL . 'assets/js/brimora-editor.js',
            array('jquery', 'elementor-editor'),
            BRIMORA_PLUGIN_VERSION,
            true
        );
        
        wp_localize_script('brimora-editor', 'brimoraEditorAjax', array(
            'ajaxUrl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('brimora_nonce')
        ));
    }
    
    public function elementor_missing_notice() {
        echo '<div class="notice notice-warning is-dismissible">';
        echo '<p><strong>Brimora:</strong> This plugin requires Elementor to be installed and activated.</p>';
        echo '</div>';
    }
    
    public function activate() {
        // Activation tasks - minimal, no schema changes
        flush_rewrite_rules();
    }
    
    public function deactivate() {
        // Deactivation tasks - clean up only our own data
        flush_rewrite_rules();
    }
}

// Initialize the plugin
Brimora::get_instance();