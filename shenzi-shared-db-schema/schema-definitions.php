<?php
/**
 * Shenzi Shared Database Schema Definitions
 * 
 * This file contains the centralized database schema definitions used by all
 * Shenzi WordPress plugins (Snefuruplin, Grove, Lumora, Beacon, etc.)
 * 
 * Version: 2.2.0
 * Last Updated: 2025-01-20
 */

class Shenzi_Shared_Schema {
    
    /**
     * Schema version for tracking updates
     */
    const SCHEMA_VERSION = '2.2.0';
    
    /**
     * Get all table definitions
     */
    public static function get_table_definitions($wpdb_prefix = '') {
        $charset_collate = '';
        if (function_exists('get_charset_collate')) {
            global $wpdb;
            $charset_collate = $wpdb->get_charset_collate();
        }
        
        return array(
            'zen_services' => self::get_zen_services_table($wpdb_prefix, $charset_collate),
            'zen_locations' => self::get_zen_locations_table($wpdb_prefix, $charset_collate),
            'zen_orbitposts' => self::get_zen_orbitposts_table($wpdb_prefix, $charset_collate),
            'zen_factory_codes' => self::get_zen_factory_codes_table($wpdb_prefix, $charset_collate),
            'zen_cache_reports' => self::get_zen_cache_reports_table($wpdb_prefix, $charset_collate),
            'zen_lighthouse_friendly_names' => self::get_zen_friendly_names_table($wpdb_prefix, $charset_collate),
            'zen_general_shortcodes' => self::get_zen_general_shortcodes_table($wpdb_prefix, $charset_collate),
            'zen_sitespren' => self::get_zen_sitespren_table($wpdb_prefix, $charset_collate)
        );
    }
    
    /**
     * Services table definition
     */
    private static function get_zen_services_table($prefix, $charset_collate) {
        $table_name = $prefix . 'zen_services';
        return "CREATE TABLE $table_name (
            service_id INT(11) NOT NULL AUTO_INCREMENT,
            service_name TEXT,
            service_placard TEXT,
            service_moniker TEXT,
            service_sobriquet TEXT,
            description1_short TEXT,
            description1_long TEXT,
            rel_image1_id INT(11),
            service_slug_id TEXT,
            is_pinned_service BOOLEAN DEFAULT FALSE,
            position_in_custom_order INT(11),
            PRIMARY KEY (service_id)
        ) $charset_collate;";
    }
    
    /**
     * Locations table definition
     */
    private static function get_zen_locations_table($prefix, $charset_collate) {
        $table_name = $prefix . 'zen_locations';
        return "CREATE TABLE $table_name (
            location_id INT(11) NOT NULL AUTO_INCREMENT,
            location_name TEXT,
            location_placard TEXT,
            location_moniker TEXT,
            location_sobriquet TEXT,
            street TEXT,
            city TEXT,
            state_code TEXT,
            zip_code TEXT,
            country TEXT,
            rel_image1_id INT(11),
            is_pinned_location BOOLEAN DEFAULT FALSE,
            position_in_custom_order INT(11),
            PRIMARY KEY (location_id)
        ) $charset_collate;";
    }
    
    /**
     * Orbitposts table definition
     */
    private static function get_zen_orbitposts_table($prefix, $charset_collate) {
        $table_name = $prefix . 'zen_orbitposts';
        return "CREATE TABLE $table_name (
            orbitpost_id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            rel_wp_post_id BIGINT(20) UNSIGNED,
            redshift_datum TEXT,
            rover_datum JSON,
            hudson_imgplanbatch_id VARCHAR(36),
            is_pinned BOOLEAN DEFAULT FALSE,
            is_flagged BOOLEAN DEFAULT FALSE,
            is_starred BOOLEAN DEFAULT FALSE,
            is_squared BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (orbitpost_id),
            KEY rel_wp_post_id (rel_wp_post_id),
            KEY hudson_imgplanbatch_id (hudson_imgplanbatch_id)
        ) $charset_collate;";
    }
    
    /**
     * Factory codes table definition
     */
    private static function get_zen_factory_codes_table($prefix, $charset_collate) {
        $table_name = $prefix . 'zen_factory_codes';
        return "CREATE TABLE $table_name (
            code_id INT(11) NOT NULL AUTO_INCREMENT,
            code_slug VARCHAR(100) NOT NULL,
            code_type VARCHAR(50) NOT NULL,
            code_title VARCHAR(255) DEFAULT NULL,
            code_description TEXT DEFAULT NULL,
            code_snippet MEDIUMTEXT NOT NULL,
            dependencies TEXT DEFAULT NULL,
            usage_example TEXT DEFAULT NULL,
            is_active BOOLEAN DEFAULT TRUE,
            is_core BOOLEAN DEFAULT FALSE,
            plugin_source VARCHAR(100) DEFAULT NULL,
            wp_version_min VARCHAR(10) DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (code_id),
            UNIQUE KEY unique_slug (code_slug),
            KEY idx_type (code_type),
            KEY idx_active (is_active),
            KEY idx_source (plugin_source)
        ) $charset_collate;";
    }
    
    /**
     * Cache reports table definition
     */
    private static function get_zen_cache_reports_table($prefix, $charset_collate) {
        $table_name = $prefix . 'zen_cache_reports';
        return "CREATE TABLE $table_name (
            report_id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            user_id BIGINT(20) UNSIGNED,
            operation_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            cache_type VARCHAR(50),
            operation_status VARCHAR(20),
            items_cleared INT(11) DEFAULT 0,
            memory_before BIGINT(20) DEFAULT 0,
            memory_after BIGINT(20) DEFAULT 0,
            execution_time_ms INT(11) DEFAULT 0,
            error_message TEXT,
            additional_data JSON,
            PRIMARY KEY (report_id),
            KEY user_id (user_id),
            KEY cache_type (cache_type),
            KEY operation_timestamp (operation_timestamp)
        ) $charset_collate;";
    }
    
    /**
     * Friendly names table definition
     */
    private static function get_zen_friendly_names_table($prefix, $charset_collate) {
        $table_name = $prefix . 'zen_lighthouse_friendly_names';
        return "CREATE TABLE $table_name (
            fname_id INT(11) NOT NULL AUTO_INCREMENT,
            db_table_name TEXT NOT NULL,
            db_column_name TEXT NOT NULL,
            friendly_name_1_datum TEXT NOT NULL,
            friendly_name_1_custom_position_a INT(11) DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (fname_id),
            KEY idx_table_column (db_table_name(100), db_column_name(100))
        ) $charset_collate;";
    }
    
    /**
     * General shortcodes table definition
     */
    private static function get_zen_general_shortcodes_table($prefix, $charset_collate) {
        $table_name = $prefix . 'zen_general_shortcodes';
        return "CREATE TABLE $table_name (
            shortcode_id INT(11) NOT NULL AUTO_INCREMENT,
            shortcode_name TEXT NOT NULL,
            shortcode_slug TEXT NOT NULL,
            shortcode_content LONGTEXT NOT NULL,
            shortcode_description TEXT DEFAULT NULL,
            shortcode_category TEXT DEFAULT NULL,
            shortcode_type TEXT DEFAULT 'custom',
            shortcode_usage_example TEXT DEFAULT NULL,
            is_active TINYINT(1) DEFAULT 1,
            is_system TINYINT(1) DEFAULT 0,
            is_global TINYINT(1) DEFAULT 0,
            is_adminpublic TINYINT(1) DEFAULT 0,
            position_order INT(11) DEFAULT 0,
            author_user_id BIGINT(20) DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (shortcode_id),
            KEY idx_shortcode_slug (shortcode_slug(100)),
            KEY idx_active (is_active),
            KEY idx_system (is_system),
            KEY idx_global (is_global),
            KEY idx_adminpublic (is_adminpublic),
            KEY idx_category (shortcode_category(100)),
            KEY idx_type (shortcode_type(50)),
            KEY idx_position (position_order),
            KEY idx_author (author_user_id)
        ) $charset_collate;";
    }
    
    /**
     * Sitespren table definition
     */
    private static function get_zen_sitespren_table($prefix, $charset_collate) {
        $table_name = $prefix . 'zen_sitespren';
        return "CREATE TABLE $table_name (
            wppma_id INT(11) NOT NULL AUTO_INCREMENT,
            sitespren_base TEXT,
            driggs_brand_name TEXT,
            driggs_street_1 TEXT,
            driggs_city TEXT,
            driggs_state_full TEXT,
            driggs_zip TEXT,
            driggs_country TEXT,
            driggs_gmaps_widget_location_1 TEXT,
            driggs_phone_1 TEXT,
            driggs_email_1 TEXT,
            driggs_short_descr TEXT,
            driggs_long_descr TEXT,
            driggs_hours TEXT,
            driggs_keywords TEXT,
            driggs_category TEXT,
            driggs_owner_name TEXT,
            driggs_year_opened TEXT,
            driggs_employees_qty TEXT,
            driggs_payment_methods TEXT,
            driggs_social_media_links TEXT,
            driggs_logo_url TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (wppma_id)
        ) $charset_collate;";
    }
    
    /**
     * Create or update all tables using dbDelta
     * This method will automatically add missing columns to existing tables
     * 
     * @param string $wpdb_prefix Optional table prefix (defaults to $wpdb->prefix)
     * @return array Results from dbDelta for each table
     */
    public static function create_or_update_tables($wpdb_prefix = '') {
        global $wpdb;
        
        // Set prefix if not provided
        if (empty($wpdb_prefix)) {
            $wpdb_prefix = $wpdb->prefix;
        }
        
        // Include WordPress upgrade functions for dbDelta
        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        
        // Get all table definitions
        $tables = self::get_table_definitions($wpdb_prefix);
        
        // Results array to track what dbDelta did
        $results = array();
        
        // Run dbDelta for each table
        foreach ($tables as $table_key => $sql) {
            $results[$table_key] = dbDelta($sql);
        }
        
        return $results;
    }
    
    /**
     * Check and update schema version
     * 
     * @return bool True if schema was updated, false if already current
     */
    public static function maybe_update_schema() {
        $installed_version = get_option('shenzi_schema_version', '0');
        
        if (version_compare($installed_version, self::SCHEMA_VERSION, '<')) {
            // Run the table updates
            $results = self::create_or_update_tables();
            
            // Update the stored version
            update_option('shenzi_schema_version', self::SCHEMA_VERSION);
            
            // Log the update results (optional)
            if (defined('WP_DEBUG') && WP_DEBUG) {
                error_log('Shenzi Schema Updated to ' . self::SCHEMA_VERSION . ': ' . print_r($results, true));
            }
            
            return true;
        }
        
        return false;
    }
    
    /**
     * Get table field definitions for admin interfaces
     */
    public static function get_table_fields() {
        return array(
            'zen_services' => array(
                'service_id', 'service_name', 'service_placard', 'service_moniker', 
                'service_sobriquet', 'description1_short', 'description1_long', 
                'rel_image1_id', 'service_slug_id', 'is_pinned_service', 'position_in_custom_order'
            ),
            'zen_locations' => array(
                'location_id', 'location_name', 'location_placard', 'location_moniker',
                'location_sobriquet', 'street', 'city', 'state_code', 'zip_code', 
                'country', 'rel_image1_id', 'is_pinned_location', 'position_in_custom_order'
            ),
            'zen_general_shortcodes' => array(
                'shortcode_id', 'shortcode_name', 'shortcode_slug', 'shortcode_content',
                'shortcode_description', 'shortcode_category', 'shortcode_type', 
                'shortcode_usage_example', 'is_active', 'is_system', 'is_global', 
                'is_adminpublic', 'position_order', 'author_user_id'
            )
        );
    }
}