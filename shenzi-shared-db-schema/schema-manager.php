<?php
/**
 * Shenzi Shared Database Schema Manager
 * 
 * This class handles the deployment and management of shared database schemas
 * across all Shenzi WordPress plugins.
 * 
 * Usage:
 * - Include this file in your plugin
 * - Call Shenzi_Schema_Manager::deploy_schema() on plugin activation
 * - Call Shenzi_Schema_Manager::check_schema_updates() on plugin init
 */

require_once dirname(__FILE__) . '/schema-definitions.php';

class Shenzi_Schema_Manager {
    
    /**
     * Option name for tracking installed schema version
     */
    const SCHEMA_VERSION_OPTION = 'shenzi_shared_schema_version';
    
    /**
     * Option name for tracking which plugins use the schema
     */
    const SCHEMA_PLUGINS_OPTION = 'shenzi_shared_schema_plugins';
    
    /**
     * Deploy/update the complete schema
     * Call this on plugin activation
     */
    public static function deploy_schema($plugin_name = 'unknown') {
        global $wpdb;
        
        try {
            // Get table definitions
            $tables = Shenzi_Shared_Schema::get_table_definitions($wpdb->prefix);
            
            // Include WordPress database upgrade functions
            require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
            
            // Create/update each table
            foreach ($tables as $table_name => $sql) {
                error_log("Shenzi Schema: Creating/updating table {$table_name}");
                $result = dbDelta($sql);
                error_log("Shenzi Schema: dbDelta result for {$table_name}: " . print_r($result, true));
            }
            
            // Update schema version
            update_option(self::SCHEMA_VERSION_OPTION, Shenzi_Shared_Schema::SCHEMA_VERSION);
            
            // Track which plugins are using this schema
            self::register_plugin($plugin_name);
            
            // Verify all tables were created
            $verification = self::verify_schema();
            if ($verification['success']) {
                error_log("Shenzi Schema: All tables verified successfully");
                return true;
            } else {
                error_log("Shenzi Schema: Schema verification failed: " . implode(', ', $verification['missing_tables']));
                return false;
            }
            
        } catch (Exception $e) {
            error_log("Shenzi Schema: Error deploying schema: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Check if schema needs updates
     * Call this on plugin init
     */
    public static function check_schema_updates($plugin_name = 'unknown') {
        $current_version = get_option(self::SCHEMA_VERSION_OPTION, '0.0.0');
        
        if (version_compare($current_version, Shenzi_Shared_Schema::SCHEMA_VERSION, '<')) {
            error_log("Shenzi Schema: Schema update needed. Current: {$current_version}, Required: " . Shenzi_Shared_Schema::SCHEMA_VERSION);
            return self::deploy_schema($plugin_name);
        }
        
        // Always ensure this plugin is registered
        self::register_plugin($plugin_name);
        return true;
    }
    
    /**
     * Register a plugin as using this schema
     */
    private static function register_plugin($plugin_name) {
        $plugins = get_option(self::SCHEMA_PLUGINS_OPTION, array());
        if (!in_array($plugin_name, $plugins)) {
            $plugins[] = $plugin_name;
            update_option(self::SCHEMA_PLUGINS_OPTION, $plugins);
        }
    }
    
    /**
     * Unregister a plugin (call on plugin deactivation)
     * Only removes schema if no other plugins are using it
     */
    public static function unregister_plugin($plugin_name) {
        $plugins = get_option(self::SCHEMA_PLUGINS_OPTION, array());
        $plugins = array_diff($plugins, array($plugin_name));
        update_option(self::SCHEMA_PLUGINS_OPTION, $plugins);
        
        // If no plugins are using the schema, we could optionally clean up
        // But per your requirements, we DON'T delete data on plugin removal
        if (empty($plugins)) {
            error_log("Shenzi Schema: No plugins using schema, but preserving data as per requirements");
        }
    }
    
    /**
     * Verify that all required tables exist
     */
    public static function verify_schema() {
        global $wpdb;
        
        $required_tables = array_keys(Shenzi_Shared_Schema::get_table_definitions($wpdb->prefix));
        $missing_tables = array();
        
        foreach ($required_tables as $table_name) {
            $full_table_name = $wpdb->prefix . $table_name;
            $exists = $wpdb->get_var("SHOW TABLES LIKE '$full_table_name'") == $full_table_name;
            
            if (!$exists) {
                $missing_tables[] = $table_name;
            }
        }
        
        return array(
            'success' => empty($missing_tables),
            'missing_tables' => $missing_tables,
            'existing_tables' => array_diff($required_tables, $missing_tables)
        );
    }
    
    /**
     * Get schema status information
     */
    public static function get_schema_status() {
        $current_version = get_option(self::SCHEMA_VERSION_OPTION, 'Not installed');
        $plugins = get_option(self::SCHEMA_PLUGINS_OPTION, array());
        $verification = self::verify_schema();
        
        return array(
            'schema_version' => $current_version,
            'latest_version' => Shenzi_Shared_Schema::SCHEMA_VERSION,
            'needs_update' => version_compare($current_version, Shenzi_Shared_Schema::SCHEMA_VERSION, '<'),
            'using_plugins' => $plugins,
            'tables_status' => $verification
        );
    }
    
    /**
     * Get allowed fields for a specific table (for admin interfaces)
     */
    public static function get_allowed_fields($table_name) {
        $fields = Shenzi_Shared_Schema::get_table_fields();
        return isset($fields[$table_name]) ? $fields[$table_name] : array();
    }
    
    /**
     * Add a new field to an existing table (for schema evolution)
     */
    public static function add_table_field($table_name, $field_name, $field_definition) {
        global $wpdb;
        
        $full_table_name = $wpdb->prefix . $table_name;
        
        // Check if field already exists
        $columns = $wpdb->get_results("DESCRIBE $full_table_name");
        foreach ($columns as $column) {
            if ($column->Field === $field_name) {
                error_log("Shenzi Schema: Field {$field_name} already exists in {$table_name}");
                return true;
            }
        }
        
        // Add the field
        $sql = "ALTER TABLE $full_table_name ADD COLUMN $field_name $field_definition";
        $result = $wpdb->query($sql);
        
        if ($result === false) {
            error_log("Shenzi Schema: Failed to add field {$field_name} to {$table_name}: " . $wpdb->last_error);
            return false;
        }
        
        error_log("Shenzi Schema: Successfully added field {$field_name} to {$table_name}");
        return true;
    }
}