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
        ?>
        <div class="wrap">
            <h1>Aardvark Plugins Mar</h1>
        </div>
        <?php
    }
}