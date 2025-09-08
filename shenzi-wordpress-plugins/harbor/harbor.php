<?php
/**
 * Plugin Name: Harbor
 * Plugin URI: https://github.com/transatlanticvoyage/harbor
 * Description: Harbor - WordPress plugin for content sync and zen data management. Alternative to Snefuruplin with shared database schema.
 * Version: 1.0.0
 * Author: Harbor Team
 * License: GPL v2 or later
 * Network: false
 * Requires at least: 5.0
 * Tested up to: 6.4
 * Requires PHP: 7.4
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Define plugin constants
define('HARBOR_PLUGIN_VERSION', '1.0.0');
define('HARBOR_PLUGIN_PATH', plugin_dir_path(__FILE__));
define('HARBOR_PLUGIN_URL', plugin_dir_url(__FILE__));
define('HARBOR_DB_VERSION', '1.0');

/**
 * Main Harbor Plugin Class
 * Shares database schema and API key system with Snefuruplin family of plugins
 */
class Harbor {
    
    private $api_key = null;
    
    public function __construct() {
        register_activation_hook(__FILE__, array($this, 'activate'));
        register_deactivation_hook(__FILE__, array($this, 'deactivate'));
        
        add_action('init', array($this, 'init'));
        add_action('rest_api_init', array($this, 'register_rest_routes'));
    }
    
    /**
     * Plugin activation
     */
    public function activate() {
        $this->create_shared_database_schema();
        $this->maybe_set_default_api_key();
        
        // Flush rewrite rules
        flush_rewrite_rules();
        
        // Set installation flag
        update_option('harbor_installed', true);
        update_option('harbor_db_version', HARBOR_DB_VERSION);
        
        error_log('Harbor plugin activated successfully');
    }
    
    /**
     * Plugin deactivation
     */
    public function deactivate() {
        // Flush rewrite rules
        flush_rewrite_rules();
        
        error_log('Harbor plugin deactivated');
    }
    
    /**
     * Initialize plugin
     */
    public function init() {
        // Check if database needs updating
        $this->maybe_update_database();
        
        // Initialize API key
        $this->api_key = $this->get_api_key();
        
        // Add admin menu
        add_action('admin_menu', array($this, 'add_admin_menu'));
        
        // Add admin notices
        add_action('admin_notices', array($this, 'admin_notices'));
    }
    
    /**
     * Create shared database schema (same as Snefuruplin and Grove)
     * Uses CREATE TABLE IF NOT EXISTS for safe operation
     */
    private function create_shared_database_schema() {
        global $wpdb;
        
        $charset_collate = $wpdb->get_charset_collate();
        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        
        // Create zen_sitespren table (shared with other plugins)
        $table_name = $wpdb->prefix . 'zen_sitespren';
        $sql = "CREATE TABLE IF NOT EXISTS $table_name (
            wppma_id int(11) NOT NULL AUTO_INCREMENT,
            wppma_db_only_created_at timestamp DEFAULT CURRENT_TIMESTAMP,
            wppma_db_only_updated_at timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            id varchar(255) NOT NULL,
            created_at timestamp NULL,
            sitespren_base varchar(255) DEFAULT NULL,
            true_root_domain varchar(255) DEFAULT NULL,
            full_subdomain varchar(255) DEFAULT NULL,
            webproperty_type varchar(255) DEFAULT NULL,
            fk_users_id varchar(255) DEFAULT NULL,
            updated_at timestamp NULL,
            wpuser1 varchar(255) DEFAULT NULL,
            wppass1 varchar(255) DEFAULT NULL,
            wp_plugin_installed1 tinyint(1) DEFAULT NULL,
            wp_plugin_connected2 tinyint(1) DEFAULT NULL,
            fk_domreg_hostaccount varchar(255) DEFAULT NULL,
            is_wp_site tinyint(1) DEFAULT NULL,
            wp_rest_app_pass varchar(255) DEFAULT NULL,
            driggs_industry varchar(255) DEFAULT NULL,
            driggs_city varchar(255) DEFAULT NULL,
            driggs_brand_name varchar(255) DEFAULT NULL,
            driggs_site_type_purpose varchar(255) DEFAULT NULL,
            driggs_email_1 varchar(255) DEFAULT NULL,
            driggs_address_full text DEFAULT NULL,
            driggs_address_species_id int(11) DEFAULT NULL,
            driggs_phone_1 varchar(255) DEFAULT NULL,
            driggs_phone1_platform_id int(11) DEFAULT NULL,
            driggs_cgig_id int(11) DEFAULT NULL,
            driggs_citations_done tinyint(1) DEFAULT NULL,
            driggs_social_profiles_done tinyint(1) DEFAULT NULL,
            driggs_special_note_for_ai_tool text DEFAULT NULL,
            driggs_hours text DEFAULT NULL,
            driggs_owner_name varchar(255) DEFAULT NULL,
            driggs_short_descr text DEFAULT NULL,
            driggs_long_descr text DEFAULT NULL,
            driggs_year_opened int(11) DEFAULT NULL,
            driggs_employees_qty int(11) DEFAULT NULL,
            driggs_keywords text DEFAULT NULL,
            driggs_category varchar(255) DEFAULT NULL,
            driggs_address_species_note text DEFAULT NULL,
            driggs_payment_methods text DEFAULT NULL,
            driggs_social_media_links text DEFAULT NULL,
            driggs_street_1 varchar(255) DEFAULT NULL,
            driggs_street_2 varchar(255) DEFAULT NULL,
            driggs_state_code varchar(10) DEFAULT NULL,
            driggs_zip varchar(20) DEFAULT NULL,
            driggs_state_full varchar(255) DEFAULT NULL,
            driggs_country varchar(255) DEFAULT NULL,
            driggs_revenue_goal decimal(15,2) DEFAULT NULL,
            ns_full varchar(255) DEFAULT NULL,
            ip_address varchar(45) DEFAULT NULL,
            is_starred1 varchar(10) DEFAULT NULL,
            icon_name varchar(255) DEFAULT NULL,
            icon_color varchar(50) DEFAULT NULL,
            is_bulldozer tinyint(1) DEFAULT 0,
            is_competitor tinyint(1) DEFAULT 0,
            is_external tinyint(1) DEFAULT 0,
            is_internal tinyint(1) DEFAULT 0,
            is_ppx tinyint(1) DEFAULT 0,
            is_ms tinyint(1) DEFAULT 0,
            is_wayback_rebuild tinyint(1) DEFAULT 0,
            is_naked_wp_build tinyint(1) DEFAULT 0,
            is_rnr tinyint(1) DEFAULT 0,
            is_aff tinyint(1) DEFAULT 0,
            is_other1 tinyint(1) DEFAULT 0,
            is_other2 tinyint(1) DEFAULT 0,
            snailimage varchar(255) DEFAULT NULL,
            snail_image_url text DEFAULT NULL,
            snail_image_status varchar(50) DEFAULT NULL,
            snail_image_error text DEFAULT NULL,
            screenshot_url text DEFAULT NULL,
            screenshot_taken_at timestamp NULL,
            screenshot_status varchar(50) DEFAULT NULL,
            rel_cncglub_id int(11) DEFAULT NULL,
            rel_city_id int(11) DEFAULT NULL,
            driggs_logo_url text DEFAULT NULL,
            rel_industry_id int(11) DEFAULT NULL,
            PRIMARY KEY (wppma_id),
            UNIQUE KEY unique_id (id),
            INDEX idx_sitespren_base (sitespren_base),
            INDEX idx_fk_users_id (fk_users_id),
            INDEX idx_is_external (is_external),
            INDEX idx_is_internal (is_internal)
        ) $charset_collate;";
        
        dbDelta($sql);
        
        // Create zen_api_keys table for shared API key storage
        $api_keys_table = $wpdb->prefix . 'zen_api_keys';
        $sql_keys = "CREATE TABLE IF NOT EXISTS $api_keys_table (
            api_key_id int(11) NOT NULL AUTO_INCREMENT,
            site_url varchar(255) NOT NULL,
            api_key varchar(500) NOT NULL,
            plugin_family varchar(50) DEFAULT 'snefuruplin',
            is_active tinyint(1) DEFAULT 1,
            created_at timestamp DEFAULT CURRENT_TIMESTAMP,
            updated_at timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            created_by_plugin varchar(50) DEFAULT 'harbor',
            last_used_at timestamp NULL,
            usage_count int(11) DEFAULT 0,
            PRIMARY KEY (api_key_id),
            UNIQUE KEY unique_site_url (site_url),
            INDEX idx_plugin_family (plugin_family),
            INDEX idx_is_active (is_active)
        ) $charset_collate;";
        
        dbDelta($sql_keys);
        
        // Create default sitespren record
        $this->maybe_insert_default_sitespren();
        
        error_log('Harbor: Shared database schema created successfully');
    }
    
    /**
     * Check if database needs updating
     */
    private function maybe_update_database() {
        $current_version = get_option('harbor_db_version', '0');
        
        if (version_compare($current_version, HARBOR_DB_VERSION, '<')) {
            $this->create_shared_database_schema();
            update_option('harbor_db_version', HARBOR_DB_VERSION);
        }
    }
    
    /**
     * Insert default sitespren record if none exists
     */
    private function maybe_insert_default_sitespren() {
        global $wpdb;
        
        $sitespren_table = $wpdb->prefix . 'zen_sitespren';
        $existing_count = $wpdb->get_var("SELECT COUNT(*) FROM $sitespren_table");
        
        if ($existing_count == 0) {
            $site_url = get_site_url();
            $parsed_url = parse_url($site_url);
            $domain = isset($parsed_url['host']) ? $parsed_url['host'] : 'localhost';
            
            $wpdb->insert(
                $sitespren_table,
                array(
                    'id' => wp_generate_uuid4(),
                    'sitespren_base' => $domain,
                    'driggs_brand_name' => get_option('blogname', 'My Site'),
                    'driggs_site_type_purpose' => 'WordPress Site - Harbor Plugin',
                    'created_at' => current_time('mysql'),
                    'updated_at' => current_time('mysql'),
                    'wp_plugin_installed1' => 1,
                    'wp_plugin_connected2' => 1,
                    'is_wp_site' => 1
                ),
                array('%s', '%s', '%s', '%s', '%s', '%s', '%d', '%d', '%d')
            );
        }
    }
    
    /**
     * Set default API key if none exists
     */
    private function maybe_set_default_api_key() {
        global $wpdb;
        
        $api_keys_table = $wpdb->prefix . 'zen_api_keys';
        $site_url = get_site_url();
        
        // Check if API key already exists for this site
        $existing_key = $wpdb->get_var($wpdb->prepare(
            "SELECT api_key FROM $api_keys_table WHERE site_url = %s AND is_active = 1",
            $site_url
        ));
        
        if (!$existing_key) {
            // Generate new API key
            $new_api_key = 'harbor_' . wp_generate_password(32, false);
            
            $wpdb->insert(
                $api_keys_table,
                array(
                    'site_url' => $site_url,
                    'api_key' => $new_api_key,
                    'plugin_family' => 'snefuruplin',
                    'is_active' => 1,
                    'created_by_plugin' => 'harbor'
                ),
                array('%s', '%s', '%s', '%d', '%s')
            );
            
            error_log("Harbor: Generated new API key for site: $site_url");
        }
    }
    
    /**
     * Get API key for this site (shared with Snefuruplin family)
     */
    private function get_api_key() {
        global $wpdb;
        
        $api_keys_table = $wpdb->prefix . 'zen_api_keys';
        $site_url = get_site_url();
        
        $api_key = $wpdb->get_var($wpdb->prepare(
            "SELECT api_key FROM $api_keys_table WHERE site_url = %s AND is_active = 1 ORDER BY created_at DESC LIMIT 1",
            $site_url
        ));
        
        return $api_key;
    }
    
    /**
     * Update API key usage
     */
    private function update_api_key_usage() {
        if (!$this->api_key) return;
        
        global $wpdb;
        $api_keys_table = $wpdb->prefix . 'zen_api_keys';
        $site_url = get_site_url();
        
        $wpdb->query($wpdb->prepare(
            "UPDATE $api_keys_table SET usage_count = usage_count + 1, last_used_at = %s WHERE site_url = %s AND api_key = %s",
            current_time('mysql'),
            $site_url,
            $this->api_key
        ));
    }
    
    /**
     * Register REST API routes for Harbor
     */
    public function register_rest_routes() {
        // Posts endpoint (equivalent to /wp-json/snefuru/v1/posts)
        register_rest_route('harbor/v1', '/posts', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_posts_endpoint'),
            'permission_callback' => array($this, 'authenticate_request'),
        ));
        
        // Test endpoint
        register_rest_route('harbor/v1', '/test', array(
            'methods' => 'GET',
            'callback' => array($this, 'test_endpoint'),
            'permission_callback' => array($this, 'authenticate_request'),
        ));
        
        // Version endpoint
        register_rest_route('harbor/v1', '/version', array(
            'methods' => 'GET',
            'callback' => array($this, 'version_endpoint'),
            'permission_callback' => array($this, 'authenticate_request'),
        ));
        
        // Plugin update endpoint
        register_rest_route('harbor/v1', '/update', array(
            'methods' => 'POST',
            'callback' => array($this, 'update_endpoint'),
            'permission_callback' => array($this, 'authenticate_request'),
        ));
    }
    
    /**
     * Authenticate API requests using shared API key
     */
    public function authenticate_request($request) {
        $auth_header = $request->get_header('authorization');
        
        if (!$auth_header) {
            return new WP_Error('no_auth', 'Authorization header required', array('status' => 401));
        }
        
        // Extract Bearer token
        if (strpos($auth_header, 'Bearer ') === 0) {
            $provided_token = substr($auth_header, 7);
        } else {
            return new WP_Error('invalid_auth_format', 'Authorization must be Bearer token', array('status' => 401));
        }
        
        // Verify against stored API key
        if (!$this->api_key || $provided_token !== $this->api_key) {
            error_log("Harbor: Authentication failed. Expected: " . substr($this->api_key ?? 'none', 0, 10) . "..., Provided: " . substr($provided_token, 0, 10) . "...");
            return new WP_Error('invalid_token', 'Invalid API key', array('status' => 401));
        }
        
        // Update usage tracking
        $this->update_api_key_usage();
        
        return true;
    }
    
    /**
     * Posts endpoint - returns all posts and pages
     */
    public function get_posts_endpoint($request) {
        error_log('Harbor: Posts endpoint called');
        
        try {
            // Get all published posts and pages
            $posts = get_posts(array(
                'numberposts' => -1,
                'post_type' => array('post', 'page'),
                'post_status' => array('publish', 'private', 'draft'),
                'orderby' => 'date',
                'order' => 'DESC'
            ));
            
            $formatted_posts = array();
            
            foreach ($posts as $post) {
                // Format data to match Snefuruplin structure
                $formatted_posts[] = array(
                    'ID' => $post->ID,
                    'post_title' => $post->post_title,
                    'post_content' => $post->post_content,
                    'post_excerpt' => $post->post_excerpt,
                    'post_status' => $post->post_status,
                    'post_type' => $post->post_type,
                    'post_date' => $post->post_date,
                    'post_modified' => $post->post_modified,
                    'post_author' => $post->post_author,
                    'post_name' => $post->post_name,
                    'post_parent' => $post->post_parent,
                    'menu_order' => $post->menu_order,
                    'comment_status' => $post->comment_status,
                    'ping_status' => $post->ping_status,
                    'guid' => $post->guid,
                    'featured_media' => get_post_thumbnail_id($post->ID),
                    'categories' => wp_get_post_categories($post->ID),
                    'tags' => wp_get_post_tags($post->ID, array('fields' => 'ids')),
                    'meta' => get_post_meta($post->ID)
                );
            }
            
            $response_data = array(
                'success' => true,
                'message' => 'Posts retrieved successfully via Harbor plugin',
                'total' => count($formatted_posts),
                'data' => $formatted_posts,
                'plugin' => 'harbor',
                'version' => HARBOR_PLUGIN_VERSION,
                'timestamp' => current_time('mysql')
            );
            
            error_log('Harbor: Returning ' . count($formatted_posts) . ' posts');
            
            return new WP_REST_Response($response_data, 200);
            
        } catch (Exception $e) {
            error_log('Harbor: Error in get_posts_endpoint: ' . $e->getMessage());
            
            return new WP_Error('posts_error', 'Error retrieving posts: ' . $e->getMessage(), array('status' => 500));
        }
    }
    
    /**
     * Test endpoint
     */
    public function test_endpoint($request) {
        return new WP_REST_Response(array(
            'success' => true,
            'message' => 'Harbor plugin is working correctly',
            'plugin' => 'harbor',
            'version' => HARBOR_PLUGIN_VERSION,
            'timestamp' => current_time('mysql'),
            'site_url' => get_site_url(),
            'api_key_status' => $this->api_key ? 'active' : 'missing'
        ), 200);
    }
    
    /**
     * Version endpoint
     */
    public function version_endpoint($request) {
        return new WP_REST_Response(array(
            'success' => true,
            'plugin' => 'harbor',
            'version' => HARBOR_PLUGIN_VERSION,
            'db_version' => get_option('harbor_db_version', '0'),
            'wp_version' => get_bloginfo('version'),
            'php_version' => phpversion(),
            'timestamp' => current_time('mysql')
        ), 200);
    }
    
    /**
     * Update endpoint
     */
    public function update_endpoint($request) {
        return new WP_REST_Response(array(
            'success' => true,
            'message' => 'Harbor plugin update endpoint (placeholder)',
            'plugin' => 'harbor',
            'version' => HARBOR_PLUGIN_VERSION,
            'timestamp' => current_time('mysql')
        ), 200);
    }
    
    /**
     * Add admin menu
     */
    public function add_admin_menu() {
        add_options_page(
            'Harbor Settings',
            'Harbor',
            'manage_options',
            'harbor-settings',
            array($this, 'admin_page')
        );
    }
    
    /**
     * Admin page
     */
    public function admin_page() {
        echo '<div class="wrap">';
        echo '<h1>Harbor Plugin Settings</h1>';
        echo '<p>Harbor is active and shares database schema with Snefuruplin family of plugins.</p>';
        
        if ($this->api_key) {
            echo '<p><strong>API Key Status:</strong> <span style="color: green;">Active</span></p>';
            echo '<p><strong>API Key:</strong> <code>' . substr($this->api_key, 0, 20) . '...</code></p>';
        } else {
            echo '<p><strong>API Key Status:</strong> <span style="color: red;">Missing</span></p>';
        }
        
        echo '<h3>API Endpoints</h3>';
        echo '<ul>';
        echo '<li><code>' . home_url('/wp-json/harbor/v1/posts') . '</code> - Get posts and pages</li>';
        echo '<li><code>' . home_url('/wp-json/harbor/v1/test') . '</code> - Test connection</li>';
        echo '<li><code>' . home_url('/wp-json/harbor/v1/version') . '</code> - Get version info</li>';
        echo '</ul>';
        
        echo '</div>';
    }
    
    /**
     * Admin notices
     */
    public function admin_notices() {
        if (!$this->api_key) {
            echo '<div class="notice notice-warning"><p><strong>Harbor:</strong> No API key found. Please check the database setup.</p></div>';
        }
    }
}

// Initialize Harbor plugin
new Harbor();