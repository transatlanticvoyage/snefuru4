<?php
/**
 * Aardvark Admin Class
 */

class Aardvark_Admin {
    
    public function __construct() {
        add_action('admin_menu', array($this, 'add_admin_menu'));
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
    
    public function display_admin_page() {
        // AGGRESSIVE NOTICE SUPPRESSION - Remove ALL WordPress admin notices
        $this->suppress_all_admin_notices();
        
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
        // Remove all admin notices immediately
        add_action('admin_print_styles', function() {
            // Remove all notice actions
            remove_all_actions('admin_notices');
            remove_all_actions('all_admin_notices');
            remove_all_actions('network_admin_notices');
            
            // Remove user admin notices
            global $wp_filter;
            if (isset($wp_filter['user_admin_notices'])) {
                unset($wp_filter['user_admin_notices']);
            }
        }, 0);
        
        // Additional cleanup for persistent notices
        add_action('admin_head', function() {
            // Hide any notices that slip through via CSS
            echo '<style type="text/css">
                .notice, .notice-warning, .notice-error, .notice-success, .notice-info,
                .updated, .error, .update-nag, .admin-notice,
                .wrap > .notice, .wrap > .error, .wrap > .updated {
                    display: none !important;
                }
            </style>';
        });
    }
}