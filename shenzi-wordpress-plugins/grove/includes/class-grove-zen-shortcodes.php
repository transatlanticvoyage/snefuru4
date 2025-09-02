<?php

/**
 * Grove Zen Shortcodes Class
 * Handles WordPress shortcodes for zen_services and zen_locations data
 */
class Grove_Zen_Shortcodes {
    
    public function __construct() {
        // Don't auto-register shortcodes - let the commander control it
        add_action('wp_enqueue_scripts', array($this, 'enqueue_styles'));
        add_action('init', array($this, 'maybe_register_shortcodes'), 15); // Later priority
    }
    
    /**
     * Maybe register shortcodes based on Grove settings
     */
    public function maybe_register_shortcodes() {
        $mode = get_option('grove_shortcode_mode', 'automatic');
        
        switch ($mode) {
            case 'automatic':
                // Default: Only if Snefuruplin not active
                if (!is_plugin_active('snefuruplin/snefuruplin.php')) {
                    $this->register_shortcodes();
                }
                break;
                
            case 'force_active':
                // Always register (override Snefuruplin)
                $this->register_shortcodes();
                break;
                
            case 'disabled':
                // Never register
                break;
        }
    }
    
    /**
     * Register all shortcodes
     */
    public function register_shortcodes() {
        // Services shortcodes
        add_shortcode('zen_services', array($this, 'render_services'));
        add_shortcode('zen_service', array($this, 'render_single_service'));
        add_shortcode('zen_service_image', array($this, 'render_service_image'));
        
        // Locations shortcodes
        add_shortcode('zen_locations', array($this, 'render_locations'));
        add_shortcode('zen_location', array($this, 'render_single_location'));
        add_shortcode('zen_location_image', array($this, 'render_location_image'));
        
        // Utility shortcodes
        add_shortcode('zen_pinned_services', array($this, 'render_pinned_services'));
        add_shortcode('zen_pinned_locations', array($this, 'render_pinned_locations'));
        
        // Sitespren shortcode
        add_shortcode('sitespren', array($this, 'render_sitespren'));
    }
    
    /**
     * Check if Grove is controlling shortcodes
     */
    public function is_grove_controlling_shortcodes() {
        $mode = get_option('grove_shortcode_mode', 'automatic');
        
        if ($mode === 'force_active') {
            return true;
        } elseif ($mode === 'automatic') {
            return !is_plugin_active('snefuruplin/snefuruplin.php');
        }
        
        return false;
    }
    
    /**
     * Enqueue shortcodes CSS only when Grove is controlling
     */
    public function enqueue_styles() {
        if ($this->is_grove_controlling_shortcodes()) {
            wp_enqueue_style(
                'grove-zen-shortcodes',
                GROVE_PLUGIN_URL . 'assets/zen-shortcodes.css',
                array(),
                GROVE_PLUGIN_VERSION
            );
        }
    }
    
    /**
     * Render services list
     * Usage: [zen_services limit="5" template="grid" show_images="true" pinned_first="true"]
     */
    public function render_services($atts) {
        $atts = shortcode_atts(array(
            'limit' => -1,
            'template' => 'list', // list, grid, cards
            'show_images' => 'false',
            'pinned_first' => 'true',
            'order' => 'ASC',
            'orderby' => 'position_in_custom_order',
            'class' => '',
            'image_size' => 'thumbnail'
        ), $atts, 'zen_services');
        
        $services = $this->get_services(array(
            'orderby' => $atts['orderby'],
            'order' => $atts['order'],
            'pinned_first' => $atts['pinned_first'] === 'true'
        ));
        
        if (empty($services)) {
            return '<p>No services found.</p>';
        }
        
        // Apply limit if specified
        if ($atts['limit'] > 0) {
            $services = array_slice($services, 0, $atts['limit']);
        }
        
        $output = '<div class="zen-services-wrapper ' . esc_attr($atts['class']) . ' zen-template-' . esc_attr($atts['template']) . '">';
        
        foreach ($services as $service) {
            $output .= $this->render_service_item($service, $atts);
        }
        
        $output .= '</div>';
        
        return $output;
    }
    
    /**
     * Render single service
     * Usage: [zen_service id="1" field="service_name"] or [zen_service id="1" template="card"]
     */
    public function render_single_service($atts) {
        $atts = shortcode_atts(array(
            'id' => '',
            'field' => '', // specific field to display
            'template' => 'full',
            'show_image' => 'true',
            'image_size' => 'medium',
            'class' => ''
        ), $atts, 'zen_service');
        
        if (empty($atts['id'])) {
            return '<p>Service ID is required.</p>';
        }
        
        $service = $this->get_service($atts['id']);
        
        if (!$service) {
            return '<p>Service not found.</p>';
        }
        
        // If specific field requested, return just that field
        if (!empty($atts['field'])) {
            return isset($service->{$atts['field']}) ? esc_html($service->{$atts['field']}) : '';
        }
        
        return $this->render_service_item($service, $atts);
    }
    
    /**
     * Render service image
     * Usage: [zen_service_image id="1" size="medium" alt="Custom alt text"]
     */
    public function render_service_image($atts) {
        $atts = shortcode_atts(array(
            'id' => '',
            'size' => 'medium',
            'alt' => '',
            'class' => 'zen-service-image',
            'link' => 'false'
        ), $atts, 'zen_service_image');
        
        if (empty($atts['id'])) {
            return '';
        }
        
        $service = $this->get_service($atts['id']);
        
        if (!$service || !$service->rel_image1_id) {
            return '';
        }
        
        $image_html = wp_get_attachment_image(
            $service->rel_image1_id, 
            $atts['size'], 
            false, 
            array(
                'class' => $atts['class'],
                'alt' => !empty($atts['alt']) ? $atts['alt'] : $service->service_name
            )
        );
        
        if ($atts['link'] === 'true') {
            $image_url = wp_get_attachment_image_url($service->rel_image1_id, 'full');
            $image_html = '<a href="' . esc_url($image_url) . '" target="_blank">' . $image_html . '</a>';
        }
        
        return $image_html;
    }
    
    /**
     * Render locations list
     * Usage: [zen_locations limit="3" template="grid" show_images="true"]
     */
    public function render_locations($atts) {
        $atts = shortcode_atts(array(
            'limit' => -1,
            'template' => 'list',
            'show_images' => 'false',
            'pinned_first' => 'true',
            'order' => 'ASC',
            'orderby' => 'position_in_custom_order',
            'class' => '',
            'image_size' => 'thumbnail'
        ), $atts, 'zen_locations');
        
        $locations = $this->get_locations(array(
            'orderby' => $atts['orderby'],
            'order' => $atts['order'],
            'pinned_first' => $atts['pinned_first'] === 'true'
        ));
        
        if (empty($locations)) {
            return '<p>No locations found.</p>';
        }
        
        if ($atts['limit'] > 0) {
            $locations = array_slice($locations, 0, $atts['limit']);
        }
        
        $output = '<div class="zen-locations-wrapper ' . esc_attr($atts['class']) . ' zen-template-' . esc_attr($atts['template']) . '">';
        
        foreach ($locations as $location) {
            $output .= $this->render_location_item($location, $atts);
        }
        
        $output .= '</div>';
        
        return $output;
    }
    
    /**
     * Render single location
     * Usage: [zen_location id="1" field="location_name"] or [zen_location id="1" template="card"]
     */
    public function render_single_location($atts) {
        $atts = shortcode_atts(array(
            'id' => '',
            'field' => '',
            'template' => 'full',
            'show_image' => 'true',
            'image_size' => 'medium',
            'class' => ''
        ), $atts, 'zen_location');
        
        if (empty($atts['id'])) {
            return '<p>Location ID is required.</p>';
        }
        
        $location = $this->get_location($atts['id']);
        
        if (!$location) {
            return '<p>Location not found.</p>';
        }
        
        if (!empty($atts['field'])) {
            return isset($location->{$atts['field']}) ? esc_html($location->{$atts['field']}) : '';
        }
        
        return $this->render_location_item($location, $atts);
    }
    
    /**
     * Render location image
     * Usage: [zen_location_image id="1" size="large"]
     */
    public function render_location_image($atts) {
        $atts = shortcode_atts(array(
            'id' => '',
            'size' => 'medium',
            'alt' => '',
            'class' => 'zen-location-image',
            'link' => 'false'
        ), $atts, 'zen_location_image');
        
        if (empty($atts['id'])) {
            return '';
        }
        
        $location = $this->get_location($atts['id']);
        
        if (!$location || !$location->rel_image1_id) {
            return '';
        }
        
        $image_html = wp_get_attachment_image(
            $location->rel_image1_id, 
            $atts['size'], 
            false, 
            array(
                'class' => $atts['class'],
                'alt' => !empty($atts['alt']) ? $atts['alt'] : $location->location_name
            )
        );
        
        if ($atts['link'] === 'true') {
            $image_url = wp_get_attachment_image_url($location->rel_image1_id, 'full');
            $image_html = '<a href="' . esc_url($image_url) . '" target="_blank">' . $image_html . '</a>';
        }
        
        return $image_html;
    }
    
    /**
     * Render only pinned services
     * Usage: [zen_pinned_services template="cards" limit="3"]
     */
    public function render_pinned_services($atts) {
        $atts = shortcode_atts(array(
            'limit' => -1,
            'template' => 'list',
            'show_images' => 'true',
            'class' => 'zen-pinned-services'
        ), $atts, 'zen_pinned_services');
        
        global $wpdb;
        $table = $wpdb->prefix . 'zen_services';
        $services = $wpdb->get_results(
            "SELECT * FROM $table WHERE is_pinned_service = 1 ORDER BY position_in_custom_order ASC"
        );
        
        if (empty($services)) {
            return '<p>No pinned services found.</p>';
        }
        
        if ($atts['limit'] > 0) {
            $services = array_slice($services, 0, $atts['limit']);
        }
        
        $output = '<div class="zen-services-wrapper ' . esc_attr($atts['class']) . ' zen-template-' . esc_attr($atts['template']) . '">';
        
        foreach ($services as $service) {
            $output .= $this->render_service_item($service, $atts);
        }
        
        $output .= '</div>';
        
        return $output;
    }
    
    /**
     * Render only pinned locations
     * Usage: [zen_pinned_locations template="grid"]
     */
    public function render_pinned_locations($atts) {
        $atts = shortcode_atts(array(
            'limit' => -1,
            'template' => 'list',
            'show_images' => 'true',
            'class' => 'zen-pinned-locations'
        ), $atts, 'zen_pinned_locations');
        
        global $wpdb;
        $table = $wpdb->prefix . 'zen_locations';
        $locations = $wpdb->get_results(
            "SELECT * FROM $table WHERE is_pinned_location = 1 ORDER BY position_in_custom_order ASC"
        );
        
        if (empty($locations)) {
            return '<p>No pinned locations found.</p>';
        }
        
        if ($atts['limit'] > 0) {
            $locations = array_slice($locations, 0, $atts['limit']);
        }
        
        $output = '<div class="zen-locations-wrapper ' . esc_attr($atts['class']) . ' zen-template-' . esc_attr($atts['template']) . '">';
        
        foreach ($locations as $location) {
            $output .= $this->render_location_item($location, $atts);
        }
        
        $output .= '</div>';
        
        return $output;
    }
    
    /**
     * Render sitespren data
     * Usage: [sitespren wppma_id="1" field="driggs_phone_1"]
     */
    public function render_sitespren($atts) {
        global $wpdb;
        
        $atts = shortcode_atts(array(
            'wppma_id' => '',
            'field' => '',
            'default' => '',
            'format' => '',
            'class' => ''
        ), $atts, 'sitespren');
        
        // Validate required parameters
        if (empty($atts['wppma_id'])) {
            return '<span class="sitespren-error">Sitespren wppma_id is required.</span>';
        }
        
        if (empty($atts['field'])) {
            return '<span class="sitespren-error">Sitespren field is required.</span>';
        }
        
        // Get the sitespren record
        $table_name = $wpdb->prefix . 'zen_sitespren';
        $sitespren = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM $table_name WHERE wppma_id = %d",
            intval($atts['wppma_id'])
        ));
        
        if (!$sitespren) {
            return !empty($atts['default']) ? esc_html($atts['default']) : '<span class="sitespren-not-found">Sitespren record not found.</span>';
        }
        
        // Check if field exists
        if (!property_exists($sitespren, $atts['field'])) {
            return !empty($atts['default']) ? esc_html($atts['default']) : '<span class="sitespren-no-field">Field not found.</span>';
        }
        
        // Get the field value
        $value = $sitespren->{$atts['field']};
        
        // Return default if value is empty
        if (empty($value) && !empty($atts['default'])) {
            $value = $atts['default'];
        }
        
        // Apply formatting if specified
        if (!empty($atts['format'])) {
            $value = $this->format_sitespren_value($value, $atts['format']);
        }
        
        // Return the formatted value
        $class = !empty($atts['class']) ? ' class="' . esc_attr($atts['class']) . '"' : '';
        return '<span' . $class . '>' . esc_html($value) . '</span>';
    }
    
    /**
     * Database helper methods - Direct SQL queries
     */
    private function get_services($args = array()) {
        global $wpdb;
        $table = $wpdb->prefix . 'zen_services';
        
        $defaults = array(
            'orderby' => 'position_in_custom_order',
            'order' => 'ASC',
            'pinned_first' => true
        );
        
        $args = wp_parse_args($args, $defaults);
        
        $order_clause = '';
        if ($args['pinned_first']) {
            $order_clause = "ORDER BY is_pinned_service DESC, {$args['orderby']} {$args['order']}";
        } else {
            $order_clause = "ORDER BY {$args['orderby']} {$args['order']}";
        }
        
        return $wpdb->get_results("SELECT * FROM $table $order_clause");
    }
    
    private function get_service($id) {
        global $wpdb;
        $table = $wpdb->prefix . 'zen_services';
        return $wpdb->get_row($wpdb->prepare("SELECT * FROM $table WHERE service_id = %d", $id));
    }
    
    private function get_locations($args = array()) {
        global $wpdb;
        $table = $wpdb->prefix . 'zen_locations';
        
        $defaults = array(
            'orderby' => 'position_in_custom_order',
            'order' => 'ASC',
            'pinned_first' => true
        );
        
        $args = wp_parse_args($args, $defaults);
        
        $order_clause = '';
        if ($args['pinned_first']) {
            $order_clause = "ORDER BY is_pinned_location DESC, {$args['orderby']} {$args['order']}";
        } else {
            $order_clause = "ORDER BY {$args['orderby']} {$args['order']}";
        }
        
        return $wpdb->get_results("SELECT * FROM $table $order_clause");
    }
    
    private function get_location($id) {
        global $wpdb;
        $table = $wpdb->prefix . 'zen_locations';
        return $wpdb->get_row($wpdb->prepare("SELECT * FROM $table WHERE location_id = %d", $id));
    }
    
    /**
     * Render individual service item based on template
     */
    private function render_service_item($service, $atts) {
        $template = $atts['template'];
        $show_images = $atts['show_images'] === 'true';
        $image_size = $atts['image_size'];
        
        $output = '<div class="zen-service-item">';
        
        // Add pinned indicator
        if ($service->is_pinned_service) {
            $output .= '<span class="zen-pinned-badge">📌 Pinned</span>';
        }
        
        switch ($template) {
            case 'grid':
            case 'cards':
                $output .= '<div class="zen-service-card">';
                if ($show_images && $service->rel_image1_id) {
                    $output .= '<div class="zen-service-image-wrapper">';
                    $output .= wp_get_attachment_image($service->rel_image1_id, $image_size, false, array('class' => 'zen-service-image'));
                    $output .= '</div>';
                }
                $output .= '<div class="zen-service-content">';
                $output .= '<h3 class="zen-service-name">' . esc_html($service->service_name) . '</h3>';
                if ($service->service_placard) {
                    $output .= '<div class="zen-service-placard">' . esc_html($service->service_placard) . '</div>';
                }
                if ($service->description1_short) {
                    $output .= '<div class="zen-service-description">' . esc_html($service->description1_short) . '</div>';
                }
                $output .= '</div></div>';
                break;
                
            case 'list':
            default:
                if ($show_images && $service->rel_image1_id) {
                    $output .= '<div class="zen-service-image-wrapper">';
                    $output .= wp_get_attachment_image($service->rel_image1_id, $image_size, false, array('class' => 'zen-service-image'));
                    $output .= '</div>';
                }
                $output .= '<div class="zen-service-content">';
                $output .= '<h3 class="zen-service-name">' . esc_html($service->service_name) . '</h3>';
                if ($service->service_placard) {
                    $output .= '<div class="zen-service-placard">' . esc_html($service->service_placard) . '</div>';
                }
                if ($service->service_moniker) {
                    $output .= '<div class="zen-service-moniker">' . esc_html($service->service_moniker) . '</div>';
                }
                if ($service->description1_short) {
                    $output .= '<div class="zen-service-description-short">' . esc_html($service->description1_short) . '</div>';
                }
                if ($service->description1_long && $template === 'full') {
                    $output .= '<div class="zen-service-description-long">' . esc_html($service->description1_long) . '</div>';
                }
                $output .= '</div>';
                break;
        }
        
        $output .= '</div>';
        
        return $output;
    }
    
    /**
     * Render individual location item based on template
     */
    private function render_location_item($location, $atts) {
        $template = $atts['template'];
        $show_images = $atts['show_images'] === 'true';
        $image_size = $atts['image_size'];
        
        $output = '<div class="zen-location-item">';
        
        if ($location->is_pinned_location) {
            $output .= '<span class="zen-pinned-badge">📌 Pinned</span>';
        }
        
        switch ($template) {
            case 'grid':
            case 'cards':
                $output .= '<div class="zen-location-card">';
                if ($show_images && $location->rel_image1_id) {
                    $output .= '<div class="zen-location-image-wrapper">';
                    $output .= wp_get_attachment_image($location->rel_image1_id, $image_size, false, array('class' => 'zen-location-image'));
                    $output .= '</div>';
                }
                $output .= '<div class="zen-location-content">';
                $output .= '<h3 class="zen-location-name">' . esc_html($location->location_name) . '</h3>';
                if ($location->location_placard) {
                    $output .= '<div class="zen-location-placard">' . esc_html($location->location_placard) . '</div>';
                }
                $address = $this->format_address($location);
                if ($address) {
                    $output .= '<div class="zen-location-address">' . $address . '</div>';
                }
                $output .= '</div></div>';
                break;
                
            case 'list':
            default:
                if ($show_images && $location->rel_image1_id) {
                    $output .= '<div class="zen-location-image-wrapper">';
                    $output .= wp_get_attachment_image($location->rel_image1_id, $image_size, false, array('class' => 'zen-location-image'));
                    $output .= '</div>';
                }
                $output .= '<div class="zen-location-content">';
                $output .= '<h3 class="zen-location-name">' . esc_html($location->location_name) . '</h3>';
                if ($location->location_placard) {
                    $output .= '<div class="zen-location-placard">' . esc_html($location->location_placard) . '</div>';
                }
                if ($location->location_moniker) {
                    $output .= '<div class="zen-location-moniker">' . esc_html($location->location_moniker) . '</div>';
                }
                $address = $this->format_address($location);
                if ($address) {
                    $output .= '<div class="zen-location-address">' . $address . '</div>';
                }
                $output .= '</div>';
                break;
        }
        
        $output .= '</div>';
        
        return $output;
    }
    
    /**
     * Format location address
     */
    private function format_address($location) {
        $address_parts = array();
        
        if ($location->street) $address_parts[] = $location->street;
        if ($location->city) $address_parts[] = $location->city;
        if ($location->state_code) $address_parts[] = $location->state_code;
        if ($location->zip_code) $address_parts[] = $location->zip_code;
        if ($location->country && $location->country !== 'US') $address_parts[] = $location->country;
        
        return implode(', ', $address_parts);
    }
    
    /**
     * Format sitespren value based on type
     */
    private function format_sitespren_value($value, $format) {
        switch ($format) {
            case 'phone':
                $cleaned = preg_replace('/[^0-9]/', '', $value);
                if (strlen($cleaned) === 10) {
                    return sprintf('(%s) %s-%s', 
                        substr($cleaned, 0, 3),
                        substr($cleaned, 3, 3),
                        substr($cleaned, 6, 4)
                    );
                }
                break;
                
            case 'currency':
                if (is_numeric($value)) {
                    return '$' . number_format((float)$value, 2);
                }
                break;
                
            case 'date':
                $timestamp = strtotime($value);
                if ($timestamp !== false) {
                    return date('F j, Y', $timestamp);
                }
                break;
                
            case 'url':
                if (!preg_match('/^https?:\/\//', $value)) {
                    return 'https://' . $value;
                }
                break;
        }
        
        return $value;
    }
}