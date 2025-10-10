<?php
/**
 * Grove Plugin Integration Example
 * 
 * This shows how to modify Grove to use the centralized schema system
 */

// In grove.php (main plugin file):

class GrovePlugin {
    
    public function __construct() {
        // Include the shared schema manager
        require_once dirname(__FILE__) . '/../../../shenzi-shared-db-schema/schema-manager.php';
        
        add_action('init', array($this, 'init'));
        register_activation_hook(__FILE__, array($this, 'activate'));
        register_deactivation_hook(__FILE__, array($this, 'deactivate'));
    }
    
    public function init() {
        // Check for schema updates on every init
        Shenzi_Schema_Manager::check_schema_updates('grove');
        
        $this->load_dependencies();
        $this->init_hooks();
    }
    
    public function activate() {
        // Deploy the complete shared schema
        $success = Shenzi_Schema_Manager::deploy_schema('grove');
        
        if (!$success) {
            wp_die('Failed to create database tables. Please check error logs.');
        }
        
        // Set default shortcode mode if not already set
        if (!get_option('grove_shortcode_mode')) {
            add_option('grove_shortcode_mode', 'automatic');
        }
    }
    
    public function deactivate() {
        // Unregister Grove from schema tracking
        // Note: This does NOT delete any data
        Shenzi_Schema_Manager::unregister_plugin('grove');
    }
}

// In class-grove-admin.php:

class Grove_Admin {
    
    public function grove_services_update_field() {
        check_ajax_referer('grove_services_nonce', 'nonce');
        
        if (!current_user_can('manage_options')) {
            wp_die('Unauthorized');
        }
        
        $id = intval($_POST['id']);
        $field = sanitize_text_field($_POST['field']);
        
        // Get allowed fields from centralized schema
        $allowed_fields = Shenzi_Schema_Manager::get_allowed_fields('zen_services');
        
        if (!in_array($field, $allowed_fields)) {
            wp_send_json_error('Invalid field name');
            return;
        }
        
        // Handle different data types
        if ($field === 'rel_image1_id') {
            $value = !empty($_POST['value']) ? intval($_POST['value']) : null;
            $format = '%d';
        } else {
            $value = sanitize_textarea_field($_POST['value']);
            $format = '%s';
        }
        
        global $wpdb;
        $table_name = $wpdb->prefix . 'zen_services';
        
        try {
            $result = $wpdb->update(
                $table_name,
                array($field => $value),
                array('service_id' => $id),
                array($format),
                array('%d')
            );
            
            if ($result === false) {
                wp_send_json_error('Database update failed: ' . $wpdb->last_error);
                return;
            }
            
            wp_send_json_success('Field updated successfully');
        } catch (Exception $e) {
            wp_send_json_error('Error updating field: ' . $e->getMessage());
        }
    }
    
    // Add schema status to admin page
    public function grove_schema_status_page() {
        $status = Shenzi_Schema_Manager::get_schema_status();
        ?>
        <div class="wrap">
            <h1>Grove Database Schema Status</h1>
            
            <table class="widefat">
                <tr>
                    <th>Current Schema Version</th>
                    <td><?php echo esc_html($status['schema_version']); ?></td>
                </tr>
                <tr>
                    <th>Latest Available Version</th>
                    <td><?php echo esc_html($status['latest_version']); ?></td>
                </tr>
                <tr>
                    <th>Update Needed</th>
                    <td><?php echo $status['needs_update'] ? 'Yes' : 'No'; ?></td>
                </tr>
                <tr>
                    <th>Plugins Using Schema</th>
                    <td><?php echo implode(', ', $status['using_plugins']); ?></td>
                </tr>
                <tr>
                    <th>Tables Status</th>
                    <td>
                        <?php if ($status['tables_status']['success']): ?>
                            ✅ All tables exist
                        <?php else: ?>
                            ❌ Missing: <?php echo implode(', ', $status['tables_status']['missing_tables']); ?>
                        <?php endif; ?>
                    </td>
                </tr>
            </table>
            
            <?php if ($status['needs_update']): ?>
                <p>
                    <a href="<?php echo admin_url('admin-post.php?action=grove_update_schema'); ?>" 
                       class="button button-primary">Update Schema Now</a>
                </p>
            <?php endif; ?>
        </div>
        <?php
    }
}

// Remove old Grove_Database class entirely - it's no longer needed!
// All database operations now use the shared schema system.