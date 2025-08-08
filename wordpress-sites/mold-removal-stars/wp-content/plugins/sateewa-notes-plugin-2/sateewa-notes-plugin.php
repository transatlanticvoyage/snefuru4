
<?php
/*
Plugin Name: Sateewa Notes
Description: A simple notes plugin for WordPress admin dashboard.
Version: 1.0
Author: Sake Nova
*/

// Hook to create the custom admin submenu under Dashboard
add_action('admin_menu', 'sateewa_notes_menu');

function sateewa_notes_menu() {
    add_submenu_page(
        'index.php', // This makes it a subitem under Dashboard
        'Sateewa Notes',
        'Sateewa Notes',
        'manage_options',
        'sateewa-notes',
        'sateewa_notes_page',
        null // No icon needed as a submenu
    );
}

// Callback function to display the notes page
function sateewa_notes_page() {
    global $wpdb;
    $table_name = $wpdb->prefix . 'sateewa_notes';
    $note = $wpdb->get_var("SELECT note FROM $table_name WHERE id = 1");

    echo '<div class="wrap" style="display: flex; justify-content: center;">';
    echo '<div style="width: 1000px;">';
    echo '<h1>Sateewa Notes</h1>';
    echo '<form method="post">';
    echo '<input type="submit" name="save_sateewa_note" class="button button-primary" value="Save Notes" style="margin-bottom: 10px;">';
    echo '<textarea name="sateewa_note" style="width:100%; height:500px;">' . esc_textarea($note) . '</textarea><br><br>';
    echo '</form>';
    echo '</div>';
    echo '</div>';

    if (isset($_POST['save_sateewa_note'])) {
        $note_content = sanitize_textarea_field($_POST['sateewa_note']);
        if ($note === null) {
            $wpdb->insert($table_name, ['note' => $note_content]);
        } else {
            $wpdb->update($table_name, ['note' => $note_content], ['id' => 1]);
        }
        echo '<div class="updated"><p>Note saved successfully.</p></div>';
    }
}

// Hook to create the database table upon plugin activation
register_activation_hook(__FILE__, 'sateewa_notes_install');

function sateewa_notes_install() {
    global $wpdb;
    $table_name = $wpdb->prefix . 'sateewa_notes';
    $charset_collate = $wpdb->get_charset_collate();

    $sql = "CREATE TABLE $table_name (
        id int(11) NOT NULL AUTO_INCREMENT,
        note text NOT NULL,
        PRIMARY KEY (id)
    ) $charset_collate;";

    require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
    dbDelta($sql);
}
