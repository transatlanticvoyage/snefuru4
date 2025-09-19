<?php
/**
 * Aardvark Admin Class
 */

class Aardvark_Admin {
    
    public function __construct() {
        add_action('admin_menu', array($this, 'add_admin_menu'));
        // Hook notice suppression very early for our specific page
        add_action('current_screen', array($this, 'maybe_suppress_notices'));
        
        // Add AJAX handlers
        add_action('wp_ajax_aardvark_toggle_plugin', array($this, 'ajax_toggle_plugin'));
        add_action('wp_ajax_aardvark_bulk_plugin_action', array($this, 'ajax_bulk_plugin_action'));
        add_action('wp_ajax_aardvark_update_plugin_field', array($this, 'ajax_update_plugin_field'));
        add_action('wp_ajax_aardvark_delete_plugin', array($this, 'ajax_delete_plugin'));
    }
    
    public function add_admin_menu() {
        add_menu_page(
            'Aardvark Plugins Mar',
            'papluginsmar',
            'manage_options',
            'papluginsmar',
            array($this, 'display_admin_page'),
            'dashicons-admin-plugins',
            25
        );
    }
    
    /**
     * Check if we're on our page and suppress notices immediately
     */
    public function maybe_suppress_notices() {
        $screen = get_current_screen();
        if ($screen && $screen->base === 'toplevel_page_papluginsmar') {
            $this->suppress_all_admin_notices();
        }
    }
    
    public function display_admin_page() {
        require_once plugin_dir_path(__FILE__) . 'pages/papluginsmar-page.php';
        $page = new Aardvark_Papluginsmar_Page();
        $page->render();
    }
    
    /**
     * AGGRESSIVE NOTICE SUPPRESSION - Remove ALL WordPress admin notices
     * Based on proven Snefuruplin/Grove implementation
     */
    private function suppress_all_admin_notices() {
        // Remove notices immediately - don't wait for hooks
        remove_all_actions('admin_notices');
        remove_all_actions('all_admin_notices');
        remove_all_actions('network_admin_notices');
        
        // Remove user admin notices
        global $wp_filter;
        if (isset($wp_filter['user_admin_notices'])) {
            unset($wp_filter['user_admin_notices']);
        }
        
        // Add immediate CSS suppression
        add_action('admin_head', function() {
            echo '<style type="text/css">
                .notice, .notice-warning, .notice-error, .notice-success, .notice-info,
                .updated, .error, .update-nag, .admin-notice,
                .wrap > .notice, .wrap > .error, .wrap > .updated,
                div[class*="notice"], div[class*="updated"], div[class*="error"] {
                    display: none !important;
                }
            </style>';
        }, 1);
        
        // Additional hook-based removal
        add_action('admin_print_styles', function() {
            remove_all_actions('admin_notices');
            remove_all_actions('all_admin_notices');
            remove_all_actions('network_admin_notices');
        }, 0);
        
        // Nuclear option - remove on admin_notices hook itself
        add_action('admin_notices', function() {
            remove_all_actions('admin_notices');
        }, -9999);
    }
    
    /**
     * AJAX handler for toggling plugin activation
     */
    public function ajax_toggle_plugin() {
        check_ajax_referer('aardvark_plugin_action', 'nonce');
        
        if (!current_user_can('activate_plugins')) {
            wp_die('Insufficient permissions');
        }
        
        $plugin = sanitize_text_field($_POST['plugin']);
        $action = sanitize_text_field($_POST['toggle_action']);
        
        if ($action === 'activate') {
            $result = activate_plugin($plugin);
        } else {
            $result = deactivate_plugins($plugin);
        }
        
        if (is_wp_error($result)) {
            wp_send_json_error($result->get_error_message());
        } else {
            wp_send_json_success('Plugin ' . $action . 'd successfully');
        }
    }
    
    /**
     * AJAX handler for bulk plugin actions
     */
    public function ajax_bulk_plugin_action() {
        check_ajax_referer('aardvark_bulk_action', 'nonce');
        
        if (!current_user_can('activate_plugins')) {
            wp_die('Insufficient permissions');
        }
        
        $action = sanitize_text_field($_POST['bulk_action']);
        $plugins = array_map('sanitize_text_field', $_POST['plugins']);
        
        $results = array();
        
        foreach ($plugins as $plugin) {
            if ($action === 'activate') {
                $result = activate_plugin($plugin);
            } elseif ($action === 'deactivate') {
                $result = deactivate_plugins($plugin);
            }
            
            if (is_wp_error($result)) {
                $results[] = $plugin . ': ' . $result->get_error_message();
            }
        }
        
        if (empty($results)) {
            wp_send_json_success('Bulk action completed successfully');
        } else {
            wp_send_json_error('Some actions failed: ' . implode(', ', $results));
        }
    }
    
    /**
     * AJAX handler for updating plugin fields (inline editing)
     */
    public function ajax_update_plugin_field() {
        check_ajax_referer('aardvark_plugin_edit', 'nonce');
        
        if (!current_user_can('manage_options')) {
            wp_die('Insufficient permissions');
        }
        
        $plugin = sanitize_text_field($_POST['plugin']);
        $field = sanitize_text_field($_POST['field']);
        $value = sanitize_text_field($_POST['value']);
        
        // Note: This is for display purposes only since WordPress plugin metadata
        // cannot be modified directly. In a real implementation, you might want to
        // store custom metadata in wp_options or a custom table.
        
        wp_send_json_success('Field updated (display only)');
    }
    
    /**
     * AJAX handler for deleting plugins
     */
    public function ajax_delete_plugin() {
        check_ajax_referer('aardvark_plugin_delete', 'nonce');
        
        if (!current_user_can('delete_plugins')) {
            wp_die('Insufficient permissions');
        }
        
        $plugin = sanitize_text_field($_POST['plugin']);
        
        if (!function_exists('delete_plugins')) {
            require_once ABSPATH . 'wp-admin/includes/plugin.php';
        }
        
        $result = delete_plugins(array($plugin));
        
        if (is_wp_error($result)) {
            wp_send_json_error($result->get_error_message());
        } else {
            wp_send_json_success('Plugin deleted successfully');
        }
    }
}