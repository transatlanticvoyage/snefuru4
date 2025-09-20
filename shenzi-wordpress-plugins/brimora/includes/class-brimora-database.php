<?php
/**
 * Brimora Database Handler
 * 
 * Independent database access for zen services data
 * No schema modifications - read-only access
 */

if (!defined('ABSPATH')) {
    exit;
}

class Brimora_Database {
    
    private $wpdb;
    
    public function __construct() {
        global $wpdb;
        $this->wpdb = $wpdb;
    }
    
    /**
     * Get all services for dropdowns
     */
    public function get_all_services() {
        $table_name = $this->wpdb->prefix . 'zen_services';
        
        // Check if table exists before querying
        if (!$this->table_exists($table_name)) {
            return array();
        }
        
        $results = $this->wpdb->get_results(
            "SELECT service_id, service_name, service_placard 
             FROM {$table_name} 
             WHERE service_name IS NOT NULL 
             ORDER BY service_name ASC"
        );
        
        return $results ? $results : array();
    }
    
    /**
     * Get service data by ID
     */
    public function get_service_by_id($service_id) {
        if (!$service_id || !is_numeric($service_id)) {
            return null;
        }
        
        $table_name = $this->wpdb->prefix . 'zen_services';
        
        if (!$this->table_exists($table_name)) {
            return null;
        }
        
        $result = $this->wpdb->get_row(
            $this->wpdb->prepare(
                "SELECT * FROM {$table_name} WHERE service_id = %d",
                $service_id
            )
        );
        
        return $result;
    }
    
    /**
     * Get image URL from service relation
     */
    public function get_service_image_url($service_id, $size = 'full') {
        $service = $this->get_service_by_id($service_id);
        
        if (!$service || !$service->rel_image1_id) {
            return '';
        }
        
        // Get WordPress attachment URL
        $image_url = wp_get_attachment_image_url($service->rel_image1_id, $size);
        
        return $image_url ? $image_url : '';
    }
    
    /**
     * Get all locations (future feature)
     */
    public function get_all_locations() {
        $table_name = $this->wpdb->prefix . 'zen_locations';
        
        if (!$this->table_exists($table_name)) {
            return array();
        }
        
        $results = $this->wpdb->get_results(
            "SELECT location_id, location_name, location_placard 
             FROM {$table_name} 
             WHERE location_name IS NOT NULL 
             ORDER BY location_name ASC"
        );
        
        return $results ? $results : array();
    }
    
    /**
     * Get location image URL (future feature)
     */
    public function get_location_image_url($location_id, $size = 'full') {
        if (!$location_id || !is_numeric($location_id)) {
            return '';
        }
        
        $table_name = $this->wpdb->prefix . 'zen_locations';
        
        if (!$this->table_exists($table_name)) {
            return '';
        }
        
        $result = $this->wpdb->get_var(
            $this->wpdb->prepare(
                "SELECT rel_image1_id FROM {$table_name} WHERE location_id = %d",
                $location_id
            )
        );
        
        if (!$result) {
            return '';
        }
        
        $image_url = wp_get_attachment_image_url($result, $size);
        return $image_url ? $image_url : '';
    }
    
    /**
     * Check if table exists
     */
    private function table_exists($table_name) {
        $result = $this->wpdb->get_var(
            $this->wpdb->prepare(
                "SHOW TABLES LIKE %s",
                $table_name
            )
        );
        
        return $result === $table_name;
    }
    
    /**
     * Get service options for Elementor dropdown
     */
    public function get_service_options() {
        $services = $this->get_all_services();
        $options = array('0' => __('None', 'brimora'));
        
        foreach ($services as $service) {
            $label = $service->service_name;
            if (!empty($service->service_placard)) {
                $label .= ' (' . $service->service_placard . ')';
            }
            $options[$service->service_id] = $label;
        }
        
        return $options;
    }
    
    /**
     * Get location options for Elementor dropdown (future feature)
     */
    public function get_location_options() {
        $locations = $this->get_all_locations();
        $options = array('0' => __('None', 'brimora'));
        
        foreach ($locations as $location) {
            $label = $location->location_name;
            if (!empty($location->location_placard)) {
                $label .= ' (' . $location->location_placard . ')';
            }
            $options[$location->location_id] = $label;
        }
        
        return $options;
    }
}