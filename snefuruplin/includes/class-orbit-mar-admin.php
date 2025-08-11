<?php
/**
 * Orbit Mar Admin Page
 * Manages the zen_orbitposts table with robust UI table grid
 */

if (!defined('ABSPATH')) {
    exit;
}

class Snefuru_Orbit_Mar_Admin {
    
    private $table_name;
    private $items_per_page = 100;
    
    public function __construct() {
        global $wpdb;
        $this->table_name = $wpdb->prefix . 'zen_orbitposts';
        
        add_action('admin_menu', array($this, 'add_admin_menu'));
        add_action('admin_enqueue_scripts', array($this, 'enqueue_assets'));
        
        // AJAX handlers
        add_action('wp_ajax_orbit_mar_get_data', array($this, 'ajax_get_data'));
        add_action('wp_ajax_orbit_mar_save_row', array($this, 'ajax_save_row'));
        add_action('wp_ajax_orbit_mar_create_row', array($this, 'ajax_create_row'));
        add_action('wp_ajax_orbit_mar_delete_rows', array($this, 'ajax_delete_rows'));
        add_action('wp_ajax_orbit_mar_operation201', array($this, 'ajax_operation201'));
        add_action('wp_ajax_orbit_mar_debug', array($this, 'ajax_debug'));
    }
    
    /**
     * Add admin menu page
     */
    public function add_admin_menu() {
        add_menu_page(
            'Orbit Mar',
            'Orbit Mar',
            'manage_options',
            'rup_orbit_mar',
            array($this, 'render_admin_page'),
            'dashicons-database',
            30
        );
    }
    
    /**
     * Enqueue assets for the admin page
     */
    public function enqueue_assets($hook) {
        if ($hook !== 'toplevel_page_rup_orbit_mar') {
            return;
        }
        
        wp_enqueue_style(
            'orbit-mar-admin',
            SNEFURU_PLUGIN_URL . 'assets/orbit-mar-admin.css',
            array(),
            SNEFURU_PLUGIN_VERSION
        );
        
        wp_enqueue_script(
            'orbit-mar-admin',
            SNEFURU_PLUGIN_URL . 'assets/orbit-mar-admin.js',
            array('jquery'),
            SNEFURU_PLUGIN_VERSION,
            true
        );
        
        wp_localize_script('orbit-mar-admin', 'orbitMarAjax', array(
            'ajaxurl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('orbit_mar_nonce')
        ));
    }
    
    /**
     * Render the admin page
     */
    public function render_admin_page() {
        // Handle direct operation201 form submission
        if (isset($_POST['run_operation201_direct']) && wp_verify_nonce($_POST['direct_nonce'], 'orbit_mar_direct_nonce')) {
            $this->run_operation201_direct();
        }
        
        // Handle clear and repopulate
        if (isset($_POST['clear_and_repopulate']) && wp_verify_nonce($_POST['direct_nonce'], 'orbit_mar_direct_nonce')) {
            $this->clear_and_repopulate();
        }
        ?>
        <div class="wrap orbit-mar-admin">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
                <h1 style="margin: 0;">Orbit Mar - Database Management</h1>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <button id="operation201-btn" class="button" style="background: maroon; color: white; font-weight: bold; font-size: 16px; padding: 12px 20px; border: none; cursor: pointer;" onclick="testOperation201();">
                        operation201 - populate _orbitposts db table for any missing wp_posts
                    </button>
                    <button id="copy-operation201-btn" class="button" style="background: #666; color: white; padding: 12px 15px; border: none; cursor: pointer;" title="Copy button text">
                        📋
                    </button>
                    <button id="test-btn" class="button" style="background: blue; color: white; padding: 8px 12px;" onclick="alert('Test button works!');">
                        TEST
                    </button>
                    <button id="debug-btn" class="button" style="background: orange; color: white; padding: 8px 12px;" onclick="debugDatabase();">
                        DEBUG DB
                    </button>
                    <form method="post" style="display: inline;">
                        <input type="hidden" name="run_operation201_direct" value="1">
                        <?php wp_nonce_field('orbit_mar_direct_nonce', 'direct_nonce'); ?>
                        <button type="submit" class="button" style="background: green; color: white; padding: 8px 12px;">
                            DIRECT OP201
                        </button>
                    </form>
                    <form method="post" style="display: inline;">
                        <input type="hidden" name="clear_and_repopulate" value="1">
                        <?php wp_nonce_field('orbit_mar_direct_nonce', 'direct_nonce'); ?>
                        <button type="submit" class="button" style="background: red; color: white; padding: 8px 12px;" onclick="return confirm('This will delete all orbitpost records and recreate them. Are you sure?');">
                            CLEAR & FIX
                        </button>
                    </form>
                </div>
            </div>
            
            <!-- Nubra Tableface Kite -->
            <div class="nubra-tableface-kite">
                <span style="font-weight: bold; color: #666; font-size: 12px;">NUBRA-TABLEFACE-KITE: Orbit Posts Grid Interface v1.0</span>
            </div>
            
            <!-- Debug Info Panel -->
            <?php
            global $wpdb;
            $table_name = $wpdb->prefix . 'zen_orbitposts';
            $table_exists = $wpdb->get_var("SHOW TABLES LIKE '$table_name'") == $table_name;
            $row_count = $table_exists ? $wpdb->get_var("SELECT COUNT(*) FROM $table_name") : 0;
            $wp_posts_count = $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->posts} WHERE post_type IN ('post', 'page') AND post_status NOT IN ('trash', 'auto-draft')");
            ?>
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 10px; margin: 10px 0; border-radius: 5px;">
                <strong>🔍 Debug Info:</strong>
                Table: <?php echo $table_name; ?> | 
                Exists: <?php echo $table_exists ? '✅ YES' : '❌ NO'; ?> | 
                Rows: <?php echo $row_count; ?> | 
                WP Posts: <?php echo $wp_posts_count; ?>
            </div>
            
            <!-- Top Controls Section -->
            <div class="orbit-mar-controls-top">
                <!-- Left Side Controls -->
                <div class="orbit-mar-controls-left">
                    <!-- Action Buttons -->
                    <div class="orbit-mar-action-buttons">
                        <button id="orbit-create-inline" class="button button-primary">Create New (Inline)</button>
                        <button id="orbit-create-popup" class="button button-primary">Create New (Popup)</button>
                        <button id="orbit-delete-selected" class="button button-secondary">Delete Selected</button>
                    </div>
                    
                    <!-- Pagination Controls Top -->
                    <div class="orbit-mar-pagination-wrapper">
                        <div class="orbit-mar-pagination-controls">
                            <div class="orbit-mar-per-page">
                                <span>Show:</span>
                                <div class="orbit-mar-button-group">
                                    <button data-perpage="10">10</button>
                                    <button data-perpage="20">20</button>
                                    <button data-perpage="50">50</button>
                                    <button data-perpage="100" class="active">100</button>
                                    <button data-perpage="200">200</button>
                                    <button data-perpage="500">500</button>
                                    <button data-perpage="all">All</button>
                                </div>
                            </div>
                            
                            <div class="orbit-mar-page-nav">
                                <span>Page:</span>
                                <div class="orbit-mar-button-group page-numbers">
                                    <!-- Dynamically populated -->
                                </div>
                            </div>
                        </div>
                        
                        <!-- Search Box -->
                        <div class="orbit-mar-search">
                            <input type="text" id="orbit-search" placeholder="Search..." />
                            <button id="orbit-clear-search" class="orbit-clear-btn">CL</button>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Main Table Grid -->
            <div class="orbit-mar-table-wrapper">
                <table id="orbit-mar-table" class="orbit-mar-table">
                    <thead>
                        <tr>
                            <th class="checkbox-column">
                                <div class="checkbox-cell">
                                    <input type="checkbox" id="orbit-select-all" />
                                </div>
                            </th>
                            <th>orbitpost_id</th>
                            <th>rel_wp_post_id</th>
                            <th>redshift_datum</th>
                            <th>created_at</th>
                            <th>updated_at</th>
                        </tr>
                    </thead>
                    <tbody>
                        <!-- Dynamically populated -->
                    </tbody>
                </table>
            </div>
            
            <!-- Bottom Pagination Controls -->
            <div class="orbit-mar-controls-bottom">
                <div class="orbit-mar-controls-left">
                    <div class="orbit-mar-pagination-wrapper">
                        <div class="orbit-mar-pagination-controls">
                            <div class="orbit-mar-per-page">
                                <span>Show:</span>
                                <div class="orbit-mar-button-group bottom-per-page">
                                    <button data-perpage="10">10</button>
                                    <button data-perpage="20">20</button>
                                    <button data-perpage="50">50</button>
                                    <button data-perpage="100" class="active">100</button>
                                    <button data-perpage="200">200</button>
                                    <button data-perpage="500">500</button>
                                    <button data-perpage="all">All</button>
                                </div>
                            </div>
                            
                            <div class="orbit-mar-page-nav">
                                <span>Page:</span>
                                <div class="orbit-mar-button-group page-numbers-bottom">
                                    <!-- Dynamically populated -->
                                </div>
                            </div>
                        </div>
                        
                        <!-- Search Box Bottom -->
                        <div class="orbit-mar-search">
                            <input type="text" id="orbit-search-bottom" placeholder="Search..." />
                            <button id="orbit-clear-search-bottom" class="orbit-clear-btn">CL</button>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Popup Modal for Create/Edit -->
            <div id="orbit-popup-modal" class="orbit-modal" style="display: none;">
                <div class="orbit-modal-content">
                    <div class="orbit-modal-header">
                        <h2>Edit Orbit Post</h2>
                        <span class="orbit-modal-close">&times;</span>
                    </div>
                    <div class="orbit-modal-body">
                        <form id="orbit-popup-form">
                            <input type="hidden" id="popup-orbitpost-id" />
                            
                            <div class="orbit-form-group">
                                <label for="popup-redshift-datum">Redshift Datum:</label>
                                <textarea id="popup-redshift-datum" rows="10"></textarea>
                            </div>
                            
                            <div class="orbit-form-group">
                                <label>Created At:</label>
                                <span id="popup-created-at">-</span>
                            </div>
                            
                            <div class="orbit-form-group">
                                <label>Updated At:</label>
                                <span id="popup-updated-at">-</span>
                            </div>
                        </form>
                    </div>
                    <div class="orbit-modal-footer">
                        <button id="orbit-popup-save" class="button button-primary">Save</button>
                        <button id="orbit-popup-cancel" class="button">Cancel</button>
                    </div>
                </div>
            </div>
        </div>
        
        <script type="text/javascript">
        // Define ajaxurl for WordPress admin
        var ajaxurl = '<?php echo admin_url('admin-ajax.php'); ?>';
        console.log('ajaxurl defined as:', ajaxurl);
        
        // Global function for direct onclick access
        function testOperation201() {
            console.log('testOperation201 called directly');
            alert('testOperation201 function called - checking AJAX...');
            
            if (!confirm('Are you sure you want to run Operation201?\\n\\nThis will create orbitpost records for ALL WordPress posts and pages (including drafts) that don\\'t already have one.')) {
                return;
            }
            
            var button = document.getElementById('operation201-btn');
            var originalText = button.textContent;
            button.disabled = true;
            button.textContent = 'Running Operation201...';
            
            console.log('About to make fetch request to:', ajaxurl);
            
            // Use fetch API as backup
            fetch(ajaxurl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    action: 'orbit_mar_operation201',
                    nonce: '<?php echo wp_create_nonce('orbit_mar_nonce'); ?>'
                })
            })
            .then(response => response.json())
            .then(data => {
                console.log('Operation201 response:', data);
                if (data.success) {
                    alert('Operation201 Results:\\n\\n' + data.data.message);
                    // Reload the page to refresh table
                    location.reload();
                } else {
                    alert('Operation201 failed: ' + (data.data || 'Unknown error'));
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Error executing Operation201: ' + error);
            })
            .finally(() => {
                button.disabled = false;
                button.textContent = originalText;
            });
        }
        
        // Debug database function
        function debugDatabase() {
            console.log('debugDatabase called');
            alert('debugDatabase function called - checking AJAX...');
            
            console.log('About to make debug fetch request to:', ajaxurl);
            
            fetch(ajaxurl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    action: 'orbit_mar_debug',
                    nonce: '<?php echo wp_create_nonce('orbit_mar_nonce'); ?>'
                })
            })
            .then(response => response.json())
            .then(data => {
                console.log('Debug response:', data);
                if (data.success) {
                    var info = data.data;
                    var message = 'DATABASE DEBUG INFO:\\n\\n';
                    message += 'Table Name: ' + info.table_name + '\\n';
                    message += 'Table Exists: ' + (info.table_exists ? 'YES' : 'NO') + '\\n';
                    if (info.table_exists) {
                        message += 'Row Count: ' + info.row_count + '\\n';
                        message += 'Columns: ' + info.columns.length + '\\n';
                    }
                    message += 'WordPress Posts Count: ' + info.wp_posts_count + '\\n';
                    alert(message);
                } else {
                    alert('Debug failed: ' + data.data);
                }
            })
            .catch(error => {
                console.error('Debug error:', error);
                alert('Debug error: ' + error);
            });
        }
        </script>
        <?php
    }
    
    /**
     * AJAX handler to get table data
     */
    public function ajax_get_data() {
        check_ajax_referer('orbit_mar_nonce', 'nonce');
        
        global $wpdb;
        
        $page = isset($_POST['page']) ? intval($_POST['page']) : 1;
        $per_page = isset($_POST['per_page']) ? $_POST['per_page'] : 100;
        $search = isset($_POST['search']) ? sanitize_text_field($_POST['search']) : '';
        
        // Build WHERE clause
        $where = '';
        if (!empty($search)) {
            $where = $wpdb->prepare(" WHERE redshift_datum LIKE %s", '%' . $wpdb->esc_like($search) . '%');
        }
        
        // Get total count
        $total = $wpdb->get_var("SELECT COUNT(*) FROM {$this->table_name}" . $where);
        
        // Calculate pagination
        if ($per_page === 'all') {
            $limit = '';
            $total_pages = 1;
        } else {
            $per_page = intval($per_page);
            $offset = ($page - 1) * $per_page;
            $limit = $wpdb->prepare(" LIMIT %d OFFSET %d", $per_page, $offset);
            $total_pages = ceil($total / $per_page);
        }
        
        // Get data
        $query = "SELECT * FROM {$this->table_name}" . $where . " ORDER BY orbitpost_id DESC" . $limit;
        $results = $wpdb->get_results($query, ARRAY_A);
        
        wp_send_json_success(array(
            'data' => $results,
            'total' => $total,
            'total_pages' => $total_pages,
            'current_page' => $page
        ));
    }
    
    /**
     * AJAX handler to save a row
     */
    public function ajax_save_row() {
        check_ajax_referer('orbit_mar_nonce', 'nonce');
        
        global $wpdb;
        
        $id = isset($_POST['id']) ? intval($_POST['id']) : 0;
        $field = isset($_POST['field']) ? sanitize_key($_POST['field']) : '';
        $value = isset($_POST['value']) ? wp_unslash($_POST['value']) : '';
        
        if (!$id || !$field) {
            wp_send_json_error('Invalid parameters');
        }
        
        // Only allow editing of specific fields
        $allowed_fields = array('redshift_datum', 'rel_wp_post_id');
        if (!in_array($field, $allowed_fields)) {
            wp_send_json_error('Field not editable');
        }
        
        $result = $wpdb->update(
            $this->table_name,
            array($field => $value),
            array('orbitpost_id' => $id)
        );
        
        if ($result === false) {
            wp_send_json_error('Update failed');
        }
        
        // Get updated row
        $row = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM {$this->table_name} WHERE orbitpost_id = %d",
            $id
        ), ARRAY_A);
        
        wp_send_json_success($row);
    }
    
    /**
     * AJAX handler to create a new row
     */
    public function ajax_create_row() {
        check_ajax_referer('orbit_mar_nonce', 'nonce');
        
        global $wpdb;
        
        $redshift_datum = isset($_POST['redshift_datum']) ? wp_unslash($_POST['redshift_datum']) : '';
        $rel_wp_post_id = isset($_POST['rel_wp_post_id']) ? intval($_POST['rel_wp_post_id']) : null;
        
        $insert_data = array('redshift_datum' => $redshift_datum);
        if ($rel_wp_post_id) {
            $insert_data['rel_wp_post_id'] = $rel_wp_post_id;
        }
        
        $result = $wpdb->insert(
            $this->table_name,
            $insert_data
        );
        
        if ($result === false) {
            wp_send_json_error('Insert failed');
        }
        
        $new_id = $wpdb->insert_id;
        
        // Get the new row
        $row = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM {$this->table_name} WHERE orbitpost_id = %d",
            $new_id
        ), ARRAY_A);
        
        wp_send_json_success($row);
    }
    
    /**
     * AJAX handler to delete selected rows
     */
    public function ajax_delete_rows() {
        check_ajax_referer('orbit_mar_nonce', 'nonce');
        
        global $wpdb;
        
        $ids = isset($_POST['ids']) ? array_map('intval', $_POST['ids']) : array();
        
        if (empty($ids)) {
            wp_send_json_error('No rows selected');
        }
        
        $placeholders = implode(',', array_fill(0, count($ids), '%d'));
        $query = $wpdb->prepare(
            "DELETE FROM {$this->table_name} WHERE orbitpost_id IN ($placeholders)",
            $ids
        );
        
        $result = $wpdb->query($query);
        
        if ($result === false) {
            wp_send_json_error('Delete failed');
        }
        
        wp_send_json_success(array('deleted' => $result));
    }
    
    /**
     * AJAX handler for operation201 - populate orbitposts for missing wp_posts
     */
    public function ajax_operation201() {
        error_log('Operation201: Starting operation');
        check_ajax_referer('orbit_mar_nonce', 'nonce');
        
        global $wpdb;
        
        try {
            error_log('Operation201: Executing query to find missing posts');
            // Get ALL posts and pages that don't already have an orbitpost record
            $query = "
                SELECT p.ID, p.post_title, p.post_type, p.post_status
                FROM {$wpdb->posts} p
                LEFT JOIN {$this->table_name} o ON p.ID = o.rel_wp_post_id
                WHERE p.post_type IN ('post', 'page')
                AND p.post_status NOT IN ('trash', 'auto-draft')
                AND o.rel_wp_post_id IS NULL
                ORDER BY p.ID ASC
            ";
            
            $missing_posts = $wpdb->get_results($query);
            error_log('Operation201: Found ' . count($missing_posts) . ' missing posts');
            
            if (empty($missing_posts)) {
                wp_send_json_success(array(
                    'message' => 'No missing posts found. All posts and pages (including drafts) already have orbitpost records.',
                    'created' => 0
                ));
            }
            
            $created_count = 0;
            $errors = array();
            
            foreach ($missing_posts as $post) {
                $result = $wpdb->insert(
                    $this->table_name,
                    array(
                        'rel_wp_post_id' => $post->ID,
                        'redshift_datum' => "Auto-created for {$post->post_type}: {$post->post_title}"
                    )
                );
                
                if ($result !== false) {
                    $created_count++;
                    error_log("Operation201: Created orbitpost for {$post->post_type} ID {$post->ID}");
                } else {
                    $errors[] = "Failed to create orbitpost for {$post->post_type} ID {$post->ID}: {$post->post_title}";
                    error_log("Operation201: Failed to create orbitpost for {$post->post_type} ID {$post->ID}");
                }
            }
            
            $message = "Operation201 completed successfully. Created {$created_count} orbitpost records for missing wp_posts (including drafts).";
            if (!empty($errors)) {
                $message .= " Errors: " . implode('; ', $errors);
            }
            
            wp_send_json_success(array(
                'message' => $message,
                'created' => $created_count,
                'total_processed' => count($missing_posts),
                'errors' => $errors
            ));
            
        } catch (Exception $e) {
            wp_send_json_error('Operation201 failed: ' . $e->getMessage());
        }
    }
    
    /**
     * Debug function to check database status
     */
    public function ajax_debug() {
        check_ajax_referer('orbit_mar_nonce', 'nonce');
        
        global $wpdb;
        
        $debug_info = array();
        
        // Check if table exists
        $table_exists = $wpdb->get_var("SHOW TABLES LIKE '{$this->table_name}'") == $this->table_name;
        $debug_info['table_exists'] = $table_exists;
        $debug_info['table_name'] = $this->table_name;
        
        if ($table_exists) {
            // Get table structure
            $columns = $wpdb->get_results("DESCRIBE {$this->table_name}");
            $debug_info['columns'] = $columns;
            
            // Get row count
            $row_count = $wpdb->get_var("SELECT COUNT(*) FROM {$this->table_name}");
            $debug_info['row_count'] = $row_count;
            
            // Get sample rows
            $sample_rows = $wpdb->get_results("SELECT * FROM {$this->table_name} LIMIT 5");
            $debug_info['sample_rows'] = $sample_rows;
        }
        
        // Get WordPress posts count
        $wp_posts_count = $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->posts} WHERE post_type IN ('post', 'page') AND post_status NOT IN ('trash', 'auto-draft')");
        $debug_info['wp_posts_count'] = $wp_posts_count;
        
        wp_send_json_success($debug_info);
    }
    
    /**
     * Direct operation201 without AJAX
     */
    private function run_operation201_direct() {
        global $wpdb;
        
        try {
            echo '<div style="background: #d4edda; border: 1px solid #c3e6cb; padding: 15px; margin: 10px 0; border-radius: 5px;">';
            echo '<strong>🚀 Running Operation201 Directly...</strong><br><br>';
            
            // Get ALL posts and pages that don't already have an orbitpost record
            $query = "
                SELECT p.ID, p.post_title, p.post_type, p.post_status
                FROM {$wpdb->posts} p
                LEFT JOIN {$this->table_name} o ON p.ID = o.rel_wp_post_id
                WHERE p.post_type IN ('post', 'page')
                AND p.post_status NOT IN ('trash', 'auto-draft')
                AND o.rel_wp_post_id IS NULL
                ORDER BY p.ID ASC
            ";
            
            $missing_posts = $wpdb->get_results($query);
            echo "Found " . count($missing_posts) . " missing posts to process.<br><br>";
            
            if (empty($missing_posts)) {
                echo '✅ No missing posts found. All posts and pages already have orbitpost records.';
            } else {
                $created_count = 0;
                $errors = array();
                
                foreach ($missing_posts as $post) {
                    $result = $wpdb->insert(
                        $this->table_name,
                        array(
                            'rel_wp_post_id' => $post->ID,
                            'redshift_datum' => "Auto-created for {$post->post_type}: {$post->post_title}"
                        )
                    );
                    
                    if ($result !== false) {
                        $created_count++;
                        echo "✅ Created orbitpost for {$post->post_type} ID {$post->ID}: {$post->post_title}<br>";
                    } else {
                        $errors[] = "Failed to create orbitpost for {$post->post_type} ID {$post->ID}: {$post->post_title}";
                        echo "❌ Failed to create orbitpost for {$post->post_type} ID {$post->ID}<br>";
                    }
                }
                
                echo "<br><strong>📊 Results:</strong><br>";
                echo "Created: {$created_count} records<br>";
                echo "Errors: " . count($errors) . "<br>";
                
                if (!empty($errors)) {
                    echo "<br><strong>Error details:</strong><br>";
                    foreach ($errors as $error) {
                        echo "• {$error}<br>";
                    }
                }
            }
            
            echo '</div>';
            
        } catch (Exception $e) {
            echo '<div style="background: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; margin: 10px 0; border-radius: 5px;">';
            echo '<strong>❌ Operation201 Direct Failed:</strong> ' . $e->getMessage();
            echo '</div>';
        }
    }
    
    /**
     * Clear all orbitpost records and repopulate correctly
     */
    private function clear_and_repopulate() {
        global $wpdb;
        
        try {
            echo '<div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; margin: 10px 0; border-radius: 5px;">';
            echo '<strong>🧹 Clearing and Repopulating Orbitposts...</strong><br><br>';
            
            // Clear all existing records
            $deleted = $wpdb->query("DELETE FROM {$this->table_name}");
            echo "Deleted {$deleted} existing records.<br><br>";
            
            // Get ALL WordPress posts and pages
            $query = "
                SELECT ID, post_title, post_type, post_status
                FROM {$wpdb->posts}
                WHERE post_type IN ('post', 'page')
                AND post_status NOT IN ('trash', 'auto-draft')
                ORDER BY ID ASC
            ";
            
            $posts = $wpdb->get_results($query);
            echo "Found " . count($posts) . " WordPress posts to process.<br><br>";
            
            if (!empty($posts)) {
                $created_count = 0;
                $errors = array();
                
                foreach ($posts as $post) {
                    // Ensure we're inserting correct data types
                    $result = $wpdb->insert(
                        $this->table_name,
                        array(
                            'rel_wp_post_id' => (int)$post->ID,  // Explicitly cast to integer
                            'redshift_datum' => "Auto-created for {$post->post_type}: {$post->post_title}"
                        ),
                        array(
                            '%d',  // rel_wp_post_id as integer
                            '%s'   // redshift_datum as string
                        )
                    );
                    
                    if ($result !== false) {
                        $created_count++;
                        echo "✅ Created orbitpost for {$post->post_type} ID {$post->ID}: {$post->post_title}<br>";
                    } else {
                        $errors[] = "Failed to create orbitpost for {$post->post_type} ID {$post->ID}: {$post->post_title}";
                        echo "❌ Failed to create orbitpost for {$post->post_type} ID {$post->ID}<br>";
                    }
                }
                
                echo "<br><strong>📊 Final Results:</strong><br>";
                echo "✅ Successfully created: {$created_count} records<br>";
                echo "❌ Errors: " . count($errors) . "<br>";
                
                if (!empty($errors)) {
                    echo "<br><strong>Error details:</strong><br>";
                    foreach ($errors as $error) {
                        echo "• {$error}<br>";
                    }
                }
                
                echo "<br>🔄 <strong>Please refresh the page to see the updated table.</strong>";
            }
            
            echo '</div>';
            
        } catch (Exception $e) {
            echo '<div style="background: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; margin: 10px 0; border-radius: 5px;">';
            echo '<strong>❌ Clear and Repopulate Failed:</strong> ' . $e->getMessage();
            echo '</div>';
        }
    }
}

// Initialize
new Snefuru_Orbit_Mar_Admin();