<?php

/**
 * Ruplin WP Database Horse Class
 * Handles creation and management of zen_services and zen_locations tables
 */
class Ruplin_WP_Database_Horse_Class {
    
    /**
     * Database version for tracking schema changes
     */
    const DB_VERSION = '1.5.0';
    
    /**
     * Option name for storing database version
     */
    const DB_VERSION_OPTION = 'snefuru_zen_db_version';
    
    /**
     * Create zen tables
     */
    public static function create_tables() {
        global $wpdb;
        
        try {
            $charset_collate = $wpdb->get_charset_collate();
            
            // Create zen_services table
            $services_table = $wpdb->prefix . 'zen_services';
            $services_sql = "CREATE TABLE $services_table (
                service_id INT(11) NOT NULL AUTO_INCREMENT,
                service_name TEXT,
                service_placard TEXT,
                service_moniker TEXT,
                service_sobriquet TEXT,
                description1_short TEXT,
                description1_long TEXT,
                rel_image1_id INT(11),
                is_pinned_service BOOLEAN DEFAULT FALSE,
                position_in_custom_order INT(11),
                PRIMARY KEY (service_id)
            ) $charset_collate;";
            
            // Create zen_locations table
            $locations_table = $wpdb->prefix . 'zen_locations';
            $locations_sql = "CREATE TABLE $locations_table (
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
            
            // Create zen_orbitposts table
            $orbitposts_table = $wpdb->prefix . 'zen_orbitposts';
            $orbitposts_sql = "CREATE TABLE $orbitposts_table (
                orbitpost_id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
                rel_wp_post_id BIGINT(20) UNSIGNED,
                redshift_datum TEXT,
                rover_datum JSON,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (orbitpost_id),
                KEY rel_wp_post_id (rel_wp_post_id)
            ) $charset_collate;";
            
            // Create zen_lighthouse_friendly_names table
            $friendly_names_table = $wpdb->prefix . 'zen_lighthouse_friendly_names';
            $friendly_names_sql = "CREATE TABLE $friendly_names_table (
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
            
            // Use dbDelta to create/update tables
            require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
            
            // Log the SQL for debugging
            error_log('Snefuru: Creating services table with SQL: ' . $services_sql);
            error_log('Snefuru: Creating locations table with SQL: ' . $locations_sql);
            error_log('Snefuru: Creating orbitposts table with SQL: ' . $orbitposts_sql);
            error_log('Snefuru: Creating friendly names table with SQL: ' . $friendly_names_sql);
            
            $services_result = dbDelta($services_sql);
            $locations_result = dbDelta($locations_sql);
            $orbitposts_result = dbDelta($orbitposts_sql);
            $friendly_names_result = dbDelta($friendly_names_sql);
            
            // Log dbDelta results
            error_log('Snefuru: Services table dbDelta result: ' . print_r($services_result, true));
            error_log('Snefuru: Locations table dbDelta result: ' . print_r($locations_result, true));
            error_log('Snefuru: Orbitposts table dbDelta result: ' . print_r($orbitposts_result, true));
            error_log('Snefuru: Friendly names table dbDelta result: ' . print_r($friendly_names_result, true));
            
            // Update database version
            update_option(self::DB_VERSION_OPTION, self::DB_VERSION);
            
            // Verify tables were created
            $services_exists = $wpdb->get_var("SHOW TABLES LIKE '$services_table'") == $services_table;
            $locations_exists = $wpdb->get_var("SHOW TABLES LIKE '$locations_table'") == $locations_table;
            $orbitposts_exists = $wpdb->get_var("SHOW TABLES LIKE '$orbitposts_table'") == $orbitposts_table;
            $friendly_names_exists = $wpdb->get_var("SHOW TABLES LIKE '$friendly_names_table'") == $friendly_names_table;
            
            // Log verification results
            error_log('Snefuru: Services table exists: ' . ($services_exists ? 'YES' : 'NO'));
            error_log('Snefuru: Locations table exists: ' . ($locations_exists ? 'YES' : 'NO'));
            error_log('Snefuru: Orbitposts table exists: ' . ($orbitposts_exists ? 'YES' : 'NO'));
            error_log('Snefuru: Friendly names table exists: ' . ($friendly_names_exists ? 'YES' : 'NO'));
            
            if ($services_exists && $locations_exists && $orbitposts_exists && $friendly_names_exists) {
                error_log('Snefuru: Zen tables created/updated successfully');
                
                // Migrate default friendly names
                self::migrate_default_friendly_names();
                
                return true;
            } else {
                error_log('Snefuru: Table verification failed');
                return false;
            }
            
        } catch (Exception $e) {
            error_log('Snefuru: Error creating zen tables: ' . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Check if tables exist
     */
    public static function tables_exist() {
        global $wpdb;
        
        $services_table = $wpdb->prefix . 'zen_services';
        $locations_table = $wpdb->prefix . 'zen_locations';
        
        $services_exists = $wpdb->get_var("SHOW TABLES LIKE '$services_table'") == $services_table;
        $locations_exists = $wpdb->get_var("SHOW TABLES LIKE '$locations_table'") == $locations_table;
        
        return $services_exists && $locations_exists;
    }
    
    /**
     * Drop zen tables (for uninstall)
     */
    public static function drop_tables() {
        global $wpdb;
        
        $services_table = $wpdb->prefix . 'zen_services';
        $locations_table = $wpdb->prefix . 'zen_locations';
        
        $wpdb->query("DROP TABLE IF EXISTS $services_table");
        $wpdb->query("DROP TABLE IF EXISTS $locations_table");
        
        // Delete database version option
        delete_option(self::DB_VERSION_OPTION);
        
        error_log('Snefuru Zen tables dropped');
    }
    
    /**
     * Check and update database schema if needed
     */
    public static function check_database_version() {
        $current_version = get_option(self::DB_VERSION_OPTION, '0.0.0');
        
        if (version_compare($current_version, self::DB_VERSION, '<')) {
            self::create_tables();
        }
    }
    
    /**
     * Get all services
     */
    public static function get_services($args = array()) {
        global $wpdb;
        $table = $wpdb->prefix . 'zen_services';
        
        $defaults = array(
            'orderby' => 'position_in_custom_order',
            'order' => 'ASC',
            'pinned_first' => true
        );
        
        $args = wp_parse_args($args, $defaults);
        
        $orderby = $args['pinned_first'] ? 'is_pinned_service DESC, position_in_custom_order' : $args['orderby'];
        $order = $args['order'];
        
        $query = "SELECT * FROM $table ORDER BY $orderby $order";
        return $wpdb->get_results($query);
    }
    
    /**
     * Get all locations
     */
    public static function get_locations($args = array()) {
        global $wpdb;
        $table = $wpdb->prefix . 'zen_locations';
        
        $defaults = array(
            'orderby' => 'position_in_custom_order',
            'order' => 'ASC',
            'pinned_first' => true
        );
        
        $args = wp_parse_args($args, $defaults);
        
        $orderby = $args['pinned_first'] ? 'is_pinned_location DESC, position_in_custom_order' : $args['orderby'];
        $order = $args['order'];
        
        $query = "SELECT * FROM $table ORDER BY $orderby $order";
        return $wpdb->get_results($query);
    }
    
    /**
     * Insert a service
     */
    public static function insert_service($data) {
        global $wpdb;
        $table = $wpdb->prefix . 'zen_services';
        
        return $wpdb->insert($table, $data);
    }
    
    /**
     * Insert a location
     */
    public static function insert_location($data) {
        global $wpdb;
        $table = $wpdb->prefix . 'zen_locations';
        
        return $wpdb->insert($table, $data);
    }
    
    /**
     * Update a service
     */
    public static function update_service($service_id, $data) {
        global $wpdb;
        $table = $wpdb->prefix . 'zen_services';
        
        return $wpdb->update($table, $data, array('service_id' => $service_id));
    }
    
    /**
     * Update a location
     */
    public static function update_location($location_id, $data) {
        global $wpdb;
        $table = $wpdb->prefix . 'zen_locations';
        
        return $wpdb->update($table, $data, array('location_id' => $location_id));
    }
    
    /**
     * Delete a service
     */
    public static function delete_service($service_id) {
        global $wpdb;
        $table = $wpdb->prefix . 'zen_services';
        
        return $wpdb->delete($table, array('service_id' => $service_id));
    }
    
    /**
     * Delete a location
     */
    public static function delete_location($location_id) {
        global $wpdb;
        $table = $wpdb->prefix . 'zen_locations';
        
        return $wpdb->delete($table, array('location_id' => $location_id));
    }
    
    /**
     * Get service by ID
     */
    public static function get_service($service_id) {
        global $wpdb;
        $table = $wpdb->prefix . 'zen_services';
        
        return $wpdb->get_row($wpdb->prepare("SELECT * FROM $table WHERE service_id = %d", $service_id));
    }
    
    /**
     * Get location by ID
     */
    public static function get_location($location_id) {
        global $wpdb;
        $table = $wpdb->prefix . 'zen_locations';
        
        return $wpdb->get_row($wpdb->prepare("SELECT * FROM $table WHERE location_id = %d", $location_id));
    }
    
    /**
     * Version-based migration system for default friendly names
     * Tracks which default entries have been installed and adds new ones on updates
     */
    public static function migrate_default_friendly_names() {
        global $wpdb;
        
        $friendly_names_table = $wpdb->prefix . 'zen_lighthouse_friendly_names';
        $installed_defaults_version = get_option('snefuru_friendly_names_defaults_version', '0.0.0');
        
        // Define default friendly names with their introduction versions
        $default_friendly_names = array(
            '1.1.0' => array(
                array(
                    'db_table_name' => 'sitespren',
                    'db_column_name' => 'driggs_brand_name',
                    'friendly_name_1_datum' => 'Business Name',
                    'friendly_name_1_custom_position_a' => 1
                ),
                array(
                    'db_table_name' => 'sitespren',
                    'db_column_name' => 'driggs_street_1',
                    'friendly_name_1_datum' => 'Street Address',
                    'friendly_name_1_custom_position_a' => 2
                ),
                array(
                    'db_table_name' => 'sitespren',
                    'db_column_name' => 'driggs_city',
                    'friendly_name_1_datum' => 'City',
                    'friendly_name_1_custom_position_a' => 3
                ),
                array(
                    'db_table_name' => 'sitespren',
                    'db_column_name' => 'driggs_state_full',
                    'friendly_name_1_datum' => 'State',
                    'friendly_name_1_custom_position_a' => 4
                ),
                array(
                    'db_table_name' => 'sitespren',
                    'db_column_name' => 'driggs_zip',
                    'friendly_name_1_datum' => 'Zip / Postal code',
                    'friendly_name_1_custom_position_a' => 5
                ),
                array(
                    'db_table_name' => 'sitespren',
                    'db_column_name' => 'driggs_country',
                    'friendly_name_1_datum' => 'Country',
                    'friendly_name_1_custom_position_a' => 6
                ),
                array(
                    'db_table_name' => 'sitespren',
                    'db_column_name' => 'driggs_phone_1',
                    'friendly_name_1_datum' => 'Phone',
                    'friendly_name_1_custom_position_a' => 7
                ),
                array(
                    'db_table_name' => 'sitespren',
                    'db_column_name' => 'sitespren_base',
                    'friendly_name_1_datum' => 'Website',
                    'friendly_name_1_custom_position_a' => 8
                ),
                array(
                    'db_table_name' => 'sitespren',
                    'db_column_name' => 'driggs_email_1',
                    'friendly_name_1_datum' => 'Business Email',
                    'friendly_name_1_custom_position_a' => 9
                ),
                array(
                    'db_table_name' => 'sitespren',
                    'db_column_name' => 'driggs_short_descr',
                    'friendly_name_1_datum' => 'Short Description (less than 250 word)',
                    'friendly_name_1_custom_position_a' => 10
                ),
                array(
                    'db_table_name' => 'sitespren',
                    'db_column_name' => 'driggs_long_descr',
                    'friendly_name_1_datum' => 'Full Description',
                    'friendly_name_1_custom_position_a' => 11
                ),
                array(
                    'db_table_name' => 'sitespren',
                    'db_column_name' => 'driggs_hours',
                    'friendly_name_1_datum' => 'Operating Hours',
                    'friendly_name_1_custom_position_a' => 12
                ),
                array(
                    'db_table_name' => 'sitespren',
                    'db_column_name' => 'driggs_keywords',
                    'friendly_name_1_datum' => 'Keywords',
                    'friendly_name_1_custom_position_a' => 13
                ),
                array(
                    'db_table_name' => 'sitespren',
                    'db_column_name' => 'driggs_category',
                    'friendly_name_1_datum' => 'Category',
                    'friendly_name_1_custom_position_a' => 14
                ),
                array(
                    'db_table_name' => 'sitespren',
                    'db_column_name' => 'driggs_owner_name',
                    'friendly_name_1_datum' => 'Owner Name',
                    'friendly_name_1_custom_position_a' => 15
                ),
                array(
                    'db_table_name' => 'sitespren',
                    'db_column_name' => 'driggs_year_opened',
                    'friendly_name_1_datum' => 'Starting year of the business',
                    'friendly_name_1_custom_position_a' => 16
                ),
                array(
                    'db_table_name' => 'sitespren',
                    'db_column_name' => 'driggs_employees_qty',
                    'friendly_name_1_datum' => 'Number of Employee',
                    'friendly_name_1_custom_position_a' => 17
                ),
                array(
                    'db_table_name' => 'sitespren',
                    'db_column_name' => 'driggs_payment_methods',
                    'friendly_name_1_datum' => 'Payment Method',
                    'friendly_name_1_custom_position_a' => 18
                ),
                array(
                    'db_table_name' => 'sitespren',
                    'db_column_name' => 'driggs_social_media_links',
                    'friendly_name_1_datum' => 'Social Media Links (GooglePlus, Facebook, Twitter etc..)',
                    'friendly_name_1_custom_position_a' => 19
                ),
                array(
                    'db_table_name' => 'sitespren',
                    'db_column_name' => 'driggs_logo_url',
                    'friendly_name_1_datum' => 'Logo and images',
                    'friendly_name_1_custom_position_a' => 20
                )
            )
        );
        
        // Install missing default friendly names from each version
        foreach ($default_friendly_names as $version => $names) {
            if (version_compare($installed_defaults_version, $version, '<')) {
                foreach ($names as $name_data) {
                    // Check if this specific friendly name already exists
                    $exists = $wpdb->get_var($wpdb->prepare(
                        "SELECT COUNT(*) FROM $friendly_names_table 
                         WHERE db_table_name = %s AND db_column_name = %s",
                        $name_data['db_table_name'],
                        $name_data['db_column_name']
                    ));
                    
                    if (!$exists) {
                        // Prepare format array based on available fields
                        $formats = array('%s', '%s', '%s');
                        if (isset($name_data['friendly_name_1_custom_position_a'])) {
                            $formats[] = '%d';
                        }
                        
                        $wpdb->insert(
                            $friendly_names_table,
                            $name_data,
                            $formats
                        );
                    } else {
                        // Update existing records with new data if version changed
                        $update_data = array('friendly_name_1_datum' => $name_data['friendly_name_1_datum']);
                        $update_formats = array('%s');
                        
                        if (isset($name_data['friendly_name_1_custom_position_a'])) {
                            $update_data['friendly_name_1_custom_position_a'] = $name_data['friendly_name_1_custom_position_a'];
                            $update_formats[] = '%d';
                        }
                        
                        $wpdb->update(
                            $friendly_names_table,
                            $update_data,
                            array(
                                'db_table_name' => $name_data['db_table_name'],
                                'db_column_name' => $name_data['db_column_name']
                            ),
                            $update_formats,
                            array('%s', '%s')
                        );
                    }
                }
            }
        }
        
        // Update the installed defaults version
        update_option('snefuru_friendly_names_defaults_version', '1.1.0');
    }
    
    /**
     * Get friendly name for a database field
     */
    public static function get_friendly_name($table_name, $column_name) {
        global $wpdb;
        
        // Remove zen_ prefix if present for table name lookup
        $table_name = str_replace('zen_', '', $table_name);
        
        $friendly_names_table = $wpdb->prefix . 'zen_lighthouse_friendly_names';
        
        $friendly_name = $wpdb->get_var($wpdb->prepare(
            "SELECT friendly_name_1_datum FROM $friendly_names_table 
             WHERE db_table_name = %s AND db_column_name = %s",
            $table_name,
            $column_name
        ));
        
        // Return friendly name if found, otherwise return formatted column name
        return $friendly_name ? $friendly_name : ucwords(str_replace('_', ' ', $column_name));
    }
    
    /**
     * Get all friendly names for a table
     */
    public static function get_table_friendly_names($table_name) {
        global $wpdb;
        
        // Remove zen_ prefix if present for table name lookup
        $table_name = str_replace('zen_', '', $table_name);
        
        $friendly_names_table = $wpdb->prefix . 'zen_lighthouse_friendly_names';
        
        return $wpdb->get_results($wpdb->prepare(
            "SELECT * FROM $friendly_names_table 
             WHERE db_table_name = %s 
             ORDER BY fname_id ASC",
            $table_name
        ));
    }
    
    /**
     * Update or insert a friendly name
     */
    public static function upsert_friendly_name($table_name, $column_name, $friendly_name) {
        global $wpdb;
        
        // Remove zen_ prefix if present for table name lookup
        $table_name = str_replace('zen_', '', $table_name);
        
        $friendly_names_table = $wpdb->prefix . 'zen_lighthouse_friendly_names';
        
        // Check if entry exists
        $exists = $wpdb->get_var($wpdb->prepare(
            "SELECT fname_id FROM $friendly_names_table 
             WHERE db_table_name = %s AND db_column_name = %s",
            $table_name,
            $column_name
        ));
        
        if ($exists) {
            // Update existing
            return $wpdb->update(
                $friendly_names_table,
                array('friendly_name_1_datum' => $friendly_name),
                array(
                    'db_table_name' => $table_name,
                    'db_column_name' => $column_name
                ),
                array('%s'),
                array('%s', '%s')
            );
        } else {
            // Insert new
            return $wpdb->insert(
                $friendly_names_table,
                array(
                    'db_table_name' => $table_name,
                    'db_column_name' => $column_name,
                    'friendly_name_1_datum' => $friendly_name
                ),
                array('%s', '%s', '%s')
            );
        }
    }
}