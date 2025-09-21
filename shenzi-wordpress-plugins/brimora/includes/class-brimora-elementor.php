<?php
/**
 * Brimora Elementor Integration
 * 
 * Adds custom controls to Elementor containers for zen services integration
 */

if (!defined('ABSPATH')) {
    exit;
}

class Brimora_Elementor {
    
    private $database;
    
    public function __construct() {
        $this->database = new Brimora_Database();
        
        // Add custom controls to Elementor containers
        add_action('elementor/element/container/section_layout/after_section_end', array($this, 'add_zen_service_controls'));
        
        // Add render attributes to containers (both frontend and editor)
        add_action('elementor/frontend/container/before_render', array($this, 'add_zen_service_attributes'));
        add_action('elementor/element/container/before_render', array($this, 'add_zen_service_attributes'));
        
        // Add custom CSS classes
        add_filter('elementor/frontend/container/should_render_hidden', array($this, 'should_render_hidden'), 10, 2);
    }
    
    /**
     * Add zen service controls to Elementor containers
     */
    public function add_zen_service_controls($element) {
        // Get service options from database
        $service_options = $this->database->get_service_options();
        
        $element->start_controls_section(
            'brimora_zen_service_section',
            array(
                'label' => __('Zen Service Background', 'brimora'),
                'tab' => \Elementor\Controls_Manager::TAB_STYLE,
            )
        );
        
        $element->add_control(
            'brimora_zen_service_id',
            array(
                'label' => __('Select Service', 'brimora'),
                'type' => \Elementor\Controls_Manager::SELECT,
                'options' => $service_options,
                'default' => '0',
                'description' => __('Choose a service to use its image as background', 'brimora'),
            )
        );
        
        $element->add_control(
            'brimora_zen_service_code',
            array(
                'label' => __('Service Code', 'brimora'),
                'type' => \Elementor\Controls_Manager::TEXT,
                'placeholder' => __('Enter custom code for this service', 'brimora'),
                'description' => __('Optional custom code for CSS targeting', 'brimora'),
                'condition' => array(
                    'brimora_zen_service_id!' => '0',
                ),
            )
        );
        
        $element->add_control(
            'brimora_background_size',
            array(
                'label' => __('Background Size', 'brimora'),
                'type' => \Elementor\Controls_Manager::SELECT,
                'options' => array(
                    'cover' => __('Cover', 'brimora'),
                    'contain' => __('Contain', 'brimora'),
                    'auto' => __('Auto', 'brimora'),
                    '100% 100%' => __('Stretch', 'brimora'),
                ),
                'default' => 'cover',
                'condition' => array(
                    'brimora_zen_service_id!' => '0',
                ),
            )
        );
        
        $element->add_control(
            'brimora_background_position',
            array(
                'label' => __('Background Position', 'brimora'),
                'type' => \Elementor\Controls_Manager::SELECT,
                'options' => array(
                    'center center' => __('Center Center', 'brimora'),
                    'center top' => __('Center Top', 'brimora'),
                    'center bottom' => __('Center Bottom', 'brimora'),
                    'left top' => __('Left Top', 'brimora'),
                    'left center' => __('Left Center', 'brimora'),
                    'left bottom' => __('Left Bottom', 'brimora'),
                    'right top' => __('Right Top', 'brimora'),
                    'right center' => __('Right Center', 'brimora'),
                    'right bottom' => __('Right Bottom', 'brimora'),
                ),
                'default' => 'center center',
                'condition' => array(
                    'brimora_zen_service_id!' => '0',
                ),
            )
        );
        
        $element->add_control(
            'brimora_background_repeat',
            array(
                'label' => __('Background Repeat', 'brimora'),
                'type' => \Elementor\Controls_Manager::SELECT,
                'options' => array(
                    'no-repeat' => __('No Repeat', 'brimora'),
                    'repeat' => __('Repeat', 'brimora'),
                    'repeat-x' => __('Repeat X', 'brimora'),
                    'repeat-y' => __('Repeat Y', 'brimora'),
                ),
                'default' => 'no-repeat',
                'condition' => array(
                    'brimora_zen_service_id!' => '0',
                ),
            )
        );
        
        $element->add_control(
            'brimora_overlay_enable',
            array(
                'label' => __('Enable Overlay', 'brimora'),
                'type' => \Elementor\Controls_Manager::SWITCHER,
                'label_on' => __('Yes', 'brimora'),
                'label_off' => __('No', 'brimora'),
                'return_value' => 'yes',
                'default' => '',
                'condition' => array(
                    'brimora_zen_service_id!' => '0',
                ),
            )
        );
        
        $element->add_control(
            'brimora_overlay_color',
            array(
                'label' => __('Overlay Color', 'brimora'),
                'type' => \Elementor\Controls_Manager::COLOR,
                'default' => 'rgba(0, 0, 0, 0.5)',
                'condition' => array(
                    'brimora_zen_service_id!' => '0',
                    'brimora_overlay_enable' => 'yes',
                ),
            )
        );
        
        $element->end_controls_section();
    }
    
    /**
     * Add zen service attributes to container before render
     */
    public function add_zen_service_attributes($element) {
        $settings = $element->get_settings();
        
        // Debug logging
        error_log('Brimora: add_zen_service_attributes called with service_id: ' . ($settings['brimora_zen_service_id'] ?? 'none'));
        
        if (!empty($settings['brimora_zen_service_id']) && $settings['brimora_zen_service_id'] != '0') {
            $service_id = $settings['brimora_zen_service_id'];
            $service_code = !empty($settings['brimora_zen_service_code']) ? $settings['brimora_zen_service_code'] : '';
            
            // Debug logging
            error_log('Brimora: Adding attributes for service_id: ' . $service_id . ', service_code: ' . $service_code);
            
            // Add data attributes for JavaScript
            $element->add_render_attribute('_wrapper', array(
                'data-brimora-service-id' => $service_id,
                'data-brimora-service-code' => $service_code,
                'data-brimora-bg-enabled' => 'true',
                'data-brimora-bg-size' => $settings['brimora_background_size'] ?? 'cover',
                'data-brimora-bg-position' => $settings['brimora_background_position'] ?? 'center center',
                'data-brimora-bg-repeat' => $settings['brimora_background_repeat'] ?? 'no-repeat',
                'data-brimora-overlay' => $settings['brimora_overlay_enable'] ?? '',
                'data-brimora-overlay-color' => $settings['brimora_overlay_color'] ?? '',
            ));
            
            // Add CSS classes
            $css_classes = array('brimora-zen-service');
            
            if (!empty($service_code)) {
                $css_classes[] = 'brimora-service-code-' . sanitize_html_class($service_code);
            }
            
            $css_classes[] = 'brimora-service-id-' . $service_id;
            
            $element->add_render_attribute('_wrapper', 'class', implode(' ', $css_classes));
        }
    }
    
    /**
     * Control hidden container rendering
     */
    public function should_render_hidden($should_render, $element) {
        // Don't interfere with Elementor's normal behavior
        return $should_render;
    }
}