<?php
/**
 * Brimora Background Handler
 * 
 * Handles AJAX requests for dynamic background images
 */

if (!defined('ABSPATH')) {
    exit;
}

class Brimora_Background_Handler {
    
    private $database;
    
    public function __construct() {
        $this->database = new Brimora_Database();
        
        // AJAX handlers for both logged in and logged out users
        add_action('wp_ajax_brimora_get_service_background', array($this, 'get_service_background'));
        add_action('wp_ajax_nopriv_brimora_get_service_background', array($this, 'get_service_background'));
        
        add_action('wp_ajax_brimora_get_location_background', array($this, 'get_location_background'));
        add_action('wp_ajax_nopriv_brimora_get_location_background', array($this, 'get_location_background'));
    }
    
    /**
     * Handle service background image AJAX request
     */
    public function get_service_background() {
        // Verify nonce
        if (!wp_verify_nonce($_POST['nonce'], 'brimora_nonce')) {
            wp_send_json_error(array('message' => __('Security check failed', 'brimora')));
            return;
        }
        
        $service_id = intval($_POST['service_id'] ?? 0);
        
        if (!$service_id) {
            wp_send_json_error(array('message' => __('Invalid service ID', 'brimora')));
            return;
        }
        
        // Get service data
        $service = $this->database->get_service_by_id($service_id);
        
        if (!$service) {
            wp_send_json_error(array('message' => __('Service not found', 'brimora')));
            return;
        }
        
        // Get image URL
        $image_url = $this->database->get_service_image_url($service_id, 'full');
        
        if (!$image_url) {
            wp_send_json_error(array('message' => __('No image found for this service', 'brimora')));
            return;
        }
        
        // Get additional image sizes for responsive use
        $image_sizes = array(
            'full' => $this->database->get_service_image_url($service_id, 'full'),
            'large' => $this->database->get_service_image_url($service_id, 'large'),
            'medium' => $this->database->get_service_image_url($service_id, 'medium'),
            'thumbnail' => $this->database->get_service_image_url($service_id, 'thumbnail'),
        );
        
        // Remove empty sizes
        $image_sizes = array_filter($image_sizes);
        
        // Get image metadata
        $attachment_id = $service->rel_image1_id;
        $image_meta = wp_get_attachment_metadata($attachment_id);
        
        $response_data = array(
            'image_url' => $image_url,
            'image_sizes' => $image_sizes,
            'attachment_id' => $attachment_id,
            'service_name' => $service->service_name,
            'service_placard' => $service->service_placard ?? '',
            'width' => $image_meta['width'] ?? null,
            'height' => $image_meta['height'] ?? null,
            'alt_text' => get_post_meta($attachment_id, '_wp_attachment_image_alt', true),
        );
        
        wp_send_json_success($response_data);
    }
    
    /**
     * Handle location background image AJAX request (future feature)
     */
    public function get_location_background() {
        // Verify nonce
        if (!wp_verify_nonce($_POST['nonce'], 'brimora_nonce')) {
            wp_send_json_error(array('message' => __('Security check failed', 'brimora')));
            return;
        }
        
        $location_id = intval($_POST['location_id'] ?? 0);
        
        if (!$location_id) {
            wp_send_json_error(array('message' => __('Invalid location ID', 'brimora')));
            return;
        }
        
        // Get image URL
        $image_url = $this->database->get_location_image_url($location_id, 'full');
        
        if (!$image_url) {
            wp_send_json_error(array('message' => __('No image found for this location', 'brimora')));
            return;
        }
        
        // Get additional image sizes
        $image_sizes = array(
            'full' => $this->database->get_location_image_url($location_id, 'full'),
            'large' => $this->database->get_location_image_url($location_id, 'large'),
            'medium' => $this->database->get_location_image_url($location_id, 'medium'),
            'thumbnail' => $this->database->get_location_image_url($location_id, 'thumbnail'),
        );
        
        $image_sizes = array_filter($image_sizes);
        
        $response_data = array(
            'image_url' => $image_url,
            'image_sizes' => $image_sizes,
        );
        
        wp_send_json_success($response_data);
    }
    
    /**
     * Validate and sanitize background settings
     */
    private function sanitize_background_settings($settings) {
        $valid_sizes = array('cover', 'contain', 'auto', '100% 100%');
        $valid_positions = array(
            'center center', 'center top', 'center bottom',
            'left top', 'left center', 'left bottom',
            'right top', 'right center', 'right bottom'
        );
        $valid_repeats = array('no-repeat', 'repeat', 'repeat-x', 'repeat-y');
        
        return array(
            'size' => in_array($settings['size'] ?? '', $valid_sizes) ? $settings['size'] : 'cover',
            'position' => in_array($settings['position'] ?? '', $valid_positions) ? $settings['position'] : 'center center',
            'repeat' => in_array($settings['repeat'] ?? '', $valid_repeats) ? $settings['repeat'] : 'no-repeat',
        );
    }
}