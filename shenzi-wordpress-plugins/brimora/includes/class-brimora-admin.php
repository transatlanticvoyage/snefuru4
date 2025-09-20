<?php
/**
 * Brimora Admin Interface
 * 
 * Simple admin page for plugin status and settings
 */

if (!defined('ABSPATH')) {
    exit;
}

class Brimora_Admin {
    
    private $database;
    
    public function __construct() {
        $this->database = new Brimora_Database();
        
        add_action('admin_menu', array($this, 'add_admin_menu'));
        add_action('admin_init', array($this, 'init_settings'));
    }
    
    /**
     * Add admin menu page
     */
    public function add_admin_menu() {
        add_options_page(
            __('Brimora Settings', 'brimora'),
            __('Brimora', 'brimora'),
            'manage_options',
            'brimora-settings',
            array($this, 'display_admin_page')
        );
    }
    
    /**
     * Initialize settings
     */
    public function init_settings() {
        register_setting('brimora_settings', 'brimora_options');
        
        add_settings_section(
            'brimora_general_section',
            __('General Settings', 'brimora'),
            array($this, 'general_section_callback'),
            'brimora_settings'
        );
        
        add_settings_field(
            'enable_debug',
            __('Enable Debug Mode', 'brimora'),
            array($this, 'debug_field_callback'),
            'brimora_settings',
            'brimora_general_section'
        );
    }
    
    /**
     * Display admin page
     */
    public function display_admin_page() {
        ?>
        <div class="wrap">
            <h1><?php echo esc_html(get_admin_page_title()); ?></h1>
            
            <!-- Status Section -->
            <div class="card">
                <h2><?php _e('Plugin Status', 'brimora'); ?></h2>
                <?php $this->display_status_section(); ?>
            </div>
            
            <!-- Database Connection Section -->
            <div class="card">
                <h2><?php _e('Database Connection', 'brimora'); ?></h2>
                <?php $this->display_database_section(); ?>
            </div>
            
            <!-- Settings Form -->
            <form method="post" action="options.php">
                <?php
                settings_fields('brimora_settings');
                do_settings_sections('brimora_settings');
                submit_button();
                ?>
            </form>
            
            <!-- Usage Information -->
            <div class="card">
                <h2><?php _e('How to Use', 'brimora'); ?></h2>
                <p><?php _e('To add zen service backgrounds to Elementor containers:', 'brimora'); ?></p>
                <ol>
                    <li><?php _e('Edit any page with Elementor', 'brimora'); ?></li>
                    <li><?php _e('Select a Container element', 'brimora'); ?></li>
                    <li><?php _e('Go to Style tab → Zen Service Background', 'brimora'); ?></li>
                    <li><?php _e('Select a service from the dropdown', 'brimora'); ?></li>
                    <li><?php _e('Optionally add a custom service code', 'brimora'); ?></li>
                    <li><?php _e('Configure background display options', 'brimora'); ?></li>
                    <li><?php _e('Update the page to see the dynamic background', 'brimora'); ?></li>
                </ol>
            </div>
        </div>
        <?php
    }
    
    /**
     * Display status section
     */
    private function display_status_section() {
        $status_items = array(
            'elementor' => array(
                'label' => __('Elementor Plugin', 'brimora'),
                'status' => did_action('elementor/loaded'),
                'required' => true,
            ),
            'zen_services' => array(
                'label' => __('Zen Services Table', 'brimora'),
                'status' => $this->check_table_exists('zen_services'),
                'required' => true,
            ),
            'zen_locations' => array(
                'label' => __('Zen Locations Table', 'brimora'),
                'status' => $this->check_table_exists('zen_locations'),
                'required' => false,
            ),
        );
        
        echo '<table class="wp-list-table widefat fixed striped">';
        echo '<thead><tr><th>' . __('Component', 'brimora') . '</th><th>' . __('Status', 'brimora') . '</th><th>' . __('Required', 'brimora') . '</th></tr></thead>';
        echo '<tbody>';
        
        foreach ($status_items as $item) {
            $status_text = $item['status'] ? 
                '<span style="color: green;">✓ ' . __('Active', 'brimora') . '</span>' : 
                '<span style="color: red;">✗ ' . __('Missing', 'brimora') . '</span>';
            
            $required_text = $item['required'] ? 
                '<span style="color: red;">' . __('Yes', 'brimora') . '</span>' : 
                '<span style="color: #666;">' . __('Optional', 'brimora') . '</span>';
            
            echo '<tr>';
            echo '<td>' . esc_html($item['label']) . '</td>';
            echo '<td>' . $status_text . '</td>';
            echo '<td>' . $required_text . '</td>';
            echo '</tr>';
        }
        
        echo '</tbody></table>';
    }
    
    /**
     * Display database section
     */
    private function display_database_section() {
        $services = $this->database->get_all_services();
        $locations = $this->database->get_all_locations();
        
        echo '<p><strong>' . __('Available Services:', 'brimora') . '</strong> ' . count($services) . '</p>';
        echo '<p><strong>' . __('Available Locations:', 'brimora') . '</strong> ' . count($locations) . '</p>';
        
        if (!empty($services)) {
            echo '<p>' . __('Recent services:', 'brimora') . '</p>';
            echo '<ul>';
            foreach (array_slice($services, 0, 5) as $service) {
                echo '<li>' . esc_html($service->service_name);
                if (!empty($service->service_placard)) {
                    echo ' (' . esc_html($service->service_placard) . ')';
                }
                echo '</li>';
            }
            echo '</ul>';
        }
    }
    
    /**
     * General section callback
     */
    public function general_section_callback() {
        echo '<p>' . __('Configure general settings for Brimora plugin.', 'brimora') . '</p>';
    }
    
    /**
     * Debug field callback
     */
    public function debug_field_callback() {
        $options = get_option('brimora_options');
        $debug = isset($options['enable_debug']) ? $options['enable_debug'] : 0;
        
        echo '<input type="checkbox" id="enable_debug" name="brimora_options[enable_debug]" value="1" ' . checked(1, $debug, false) . ' />';
        echo '<label for="enable_debug">' . __('Enable debug mode for troubleshooting', 'brimora') . '</label>';
    }
    
    /**
     * Check if table exists
     */
    private function check_table_exists($table_name) {
        global $wpdb;
        $full_table_name = $wpdb->prefix . $table_name;
        
        $result = $wpdb->get_var(
            $wpdb->prepare(
                "SHOW TABLES LIKE %s",
                $full_table_name
            )
        );
        
        return $result === $full_table_name;
    }
}