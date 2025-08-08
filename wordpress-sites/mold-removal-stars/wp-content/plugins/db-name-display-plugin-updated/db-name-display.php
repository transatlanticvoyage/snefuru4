<?php
/*
Plugin Name: Database Name Display
Description: Displays the database name of the WordPress site in the Dashboard.
Version: 1.1
Author: Sake Nova
*/

// Add a menu item to the WordPress Dashboard
add_action('admin_menu', 'db_name_display_menu');

function db_name_display_menu() {
    add_dashboard_page('Database Name', 'Database Name', 'manage_options', 'db-name-display', 'db_name_display_page');
}

// Display the database name on the Dashboard page
function db_name_display_page() {
    if (!current_user_can('manage_options')) {
        wp_die(__('You do not have sufficient permissions to access this page.'));
    }

    global $wpdb;
    $db_name = $wpdb->dbname;

    echo '<div class="wrap">';
    echo '<div style="padding: 20px; border: 2px solid #ccc; border-radius: 8px; max-width: 400px; text-align: center;">';
    echo '<input type="text" value="' . esc_html($db_name) . '" id="db-name-display" style="font-size: 24px; width: 100%; text-align: center;" readonly onclick="copyToClipboard()">';
    echo '<button onclick="copyToClipboard()" style="margin-top: 10px; padding: 8px 16px;">Copy Database Name</button>';
    echo '</div>';

    echo '<script>
    function copyToClipboard() {
        var copyText = document.getElementById("db-name-display");
        copyText.select();
        copyText.setSelectionRange(0, 99999);
        document.execCommand("copy");
        alert("Database Name copied: " + copyText.value);
    }
    </script>';

    echo '</div>';
}
