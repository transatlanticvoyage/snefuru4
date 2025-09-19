<?php
/**
 * Aardvark Admin Class
 */

class Aardvark_Admin {
    
    public function __construct() {
        add_action('admin_menu', array($this, 'add_admin_menu'));
        // Hook notice suppression very early for our specific page
        add_action('current_screen', array($this, 'maybe_suppress_notices'));
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
        ?>
        <div class="wrap">
            <h1>Aardvark Plugins Mar</h1>
        </div>
        <?php
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
}