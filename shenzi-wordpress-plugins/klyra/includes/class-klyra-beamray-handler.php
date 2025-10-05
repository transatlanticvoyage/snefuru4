<?php

if (!defined('ABSPATH')) {
    exit;
}

class Klyra_Beamray_Handler {
    
    public function __construct() {
        add_action('wp_ajax_klyra_get_posts_data', array($this, 'ajax_get_posts_data'));
        add_action('wp_ajax_klyra_update_post_field', array($this, 'ajax_update_post_field'));
        add_action('wp_ajax_klyra_create_post', array($this, 'ajax_create_post'));
        add_action('wp_ajax_klyra_update_post_content', array($this, 'ajax_update_post_content'));
        add_action('wp_ajax_klyra_update_elementor_data', array($this, 'ajax_update_elementor_data'));
        add_action('wp_ajax_klyra_create_auto_numbered_post', array($this, 'ajax_create_auto_numbered_post'));
        add_action('wp_ajax_klyra_create_auto_numbered_page', array($this, 'ajax_create_auto_numbered_page'));
    }
    
    public function ajax_get_posts_data() {
        check_ajax_referer('klyra_beamray_nonce', 'nonce');
        
        $page = isset($_POST['page']) ? intval($_POST['page']) : 1;
        $per_page = isset($_POST['per_page']) ? $_POST['per_page'] : 25;
        $search = isset($_POST['search']) ? sanitize_text_field($_POST['search']) : '';
        $post_type_filter = isset($_POST['post_type']) ? sanitize_text_field($_POST['post_type']) : '';
        $post_status_filter = isset($_POST['post_status']) ? sanitize_text_field($_POST['post_status']) : '';
        $service_assignment_filter = isset($_POST['service_assignment']) ? sanitize_text_field($_POST['service_assignment']) : 'all';
        $icepick_filter = isset($_POST['icepick_filter']) ? sanitize_text_field($_POST['icepick_filter']) : '';
        $sort_field = isset($_POST['sort_field']) ? sanitize_text_field($_POST['sort_field']) : '';
        $sort_order = isset($_POST['sort_order']) ? sanitize_text_field($_POST['sort_order']) : 'asc';
        
        if ($per_page === 'all') {
            $per_page = 999999;
        } else {
            $per_page = intval($per_page);
        }
        
        global $wpdb;
        
        $where_clauses = array("p.post_type IN ('post', 'page')");
        
        if (!empty($post_type_filter) && $post_type_filter !== 'all') {
            $where_clauses[] = $wpdb->prepare("p.post_type = %s", $post_type_filter);
        }
        
        if (!empty($post_status_filter)) {
            $where_clauses[] = $wpdb->prepare("p.post_status = %s", $post_status_filter);
        }
        
        if (!empty($search)) {
            $like = '%' . $wpdb->esc_like($search) . '%';
            $where_clauses[] = $wpdb->prepare(
                "(p.post_title LIKE %s OR p.post_content LIKE %s OR p.post_name LIKE %s)",
                $like, $like, $like
            );
        }
        
        // Handle service assignment filter
        if ($service_assignment_filter === 'assigned') {
            $where_clauses[] = "p.ID IN (SELECT asn_service_page_id FROM {$wpdb->prefix}zen_services WHERE asn_service_page_id IS NOT NULL)";
        } elseif ($service_assignment_filter === 'non-assigned') {
            $where_clauses[] = "p.ID NOT IN (SELECT asn_service_page_id FROM {$wpdb->prefix}zen_services WHERE asn_service_page_id IS NOT NULL)";
        }
        // For 'all', no additional filter is applied
        
        // Handle icepick filter (home/blog/assigned/others)
        if (!empty($icepick_filter) && $icepick_filter !== 'all') {
            $front_page_id = get_option('page_on_front');
            $posts_page_id = get_option('page_for_posts');
            
            if ($icepick_filter === 'home') {
                // Show only the front page
                if ($front_page_id) {
                    $where_clauses[] = $wpdb->prepare("p.ID = %d", $front_page_id);
                } else {
                    // If no front page is set, show no results
                    $where_clauses[] = "p.ID = 0";
                }
            } elseif ($icepick_filter === 'blog') {
                // Show only the posts page
                if ($posts_page_id) {
                    $where_clauses[] = $wpdb->prepare("p.ID = %d", $posts_page_id);
                } else {
                    // If no posts page is set, show no results
                    $where_clauses[] = "p.ID = 0";
                }
            } elseif ($icepick_filter === 'assigned') {
                // Show only pages that are assigned to services
                $where_clauses[] = "p.ID IN (SELECT asn_service_page_id FROM {$wpdb->prefix}zen_services WHERE asn_service_page_id IS NOT NULL)";
            } elseif ($icepick_filter === 'others') {
                // Show all pages except home, blog, and assigned pages
                $exclude_ids = array();
                if ($front_page_id) $exclude_ids[] = $front_page_id;
                if ($posts_page_id) $exclude_ids[] = $posts_page_id;
                
                // Build the exclusion query for others
                $exclusion_parts = array();
                
                // Exclude home and blog pages if they exist
                if (!empty($exclude_ids)) {
                    $exclude_placeholders = implode(',', array_fill(0, count($exclude_ids), '%d'));
                    $exclusion_parts[] = $wpdb->prepare("p.ID NOT IN ($exclude_placeholders)", $exclude_ids);
                }
                
                // Also exclude assigned pages
                $exclusion_parts[] = "p.ID NOT IN (SELECT asn_service_page_id FROM {$wpdb->prefix}zen_services WHERE asn_service_page_id IS NOT NULL)";
                
                // Combine all exclusions
                if (!empty($exclusion_parts)) {
                    $where_clauses[] = '(' . implode(' AND ', $exclusion_parts) . ')';
                }
            }
        }
        
        $where_sql = implode(' AND ', $where_clauses);
        
        $total_query = "SELECT COUNT(DISTINCT p.ID) 
                       FROM {$wpdb->prefix}posts p
                       WHERE {$where_sql}";
        
        $total = $wpdb->get_var($total_query);
        
        $offset = ($page - 1) * $per_page;
        
        // Determine sort clause
        $order_clause = 'p.post_modified DESC'; // Default sort
        if (!empty($sort_field)) {
            $allowed_sort_fields = array(
                'post_title', 'ID', 'post_status', 'post_name', 'post_content',
                'post_date', 'post_modified', 'post_author', 'post_parent', 'menu_order'
            );
            
            if (in_array($sort_field, $allowed_sort_fields)) {
                $sort_direction = strtoupper($sort_order) === 'DESC' ? 'DESC' : 'ASC';
                $order_clause = "p.{$sort_field} {$sort_direction}";
            }
        }
        
        $query = "SELECT p.ID, p.post_title, p.post_content, p.post_type, p.post_status, 
                         p.post_name, p.post_date, p.post_modified, p.post_author, 
                         p.post_parent, p.menu_order, p.comment_status, p.ping_status,
                         pm._elementor_data,
                         op.rel_wp_post_id, op.orbitpost_id, op.redshift_datum, op.rover_datum,
                         op.hudson_imgplanbatch_id, op.is_pinned, op.is_flagged, op.is_starred, 
                         op.is_squared, op.created_at, op.updated_at
                  FROM {$wpdb->prefix}posts p
                  LEFT JOIN (
                      SELECT post_id, meta_value as _elementor_data
                      FROM {$wpdb->prefix}postmeta
                      WHERE meta_key = '_elementor_data'
                  ) pm ON p.ID = pm.post_id
                  LEFT JOIN {$wpdb->prefix}zen_orbitposts op ON p.ID = op.rel_wp_post_id
                  WHERE {$where_sql}
                  ORDER BY {$order_clause}
                  LIMIT %d OFFSET %d";
        
        $results = $wpdb->get_results(
            $wpdb->prepare($query, $per_page, $offset),
            ARRAY_A
        );
        
        wp_send_json_success(array(
            'data' => $results,
            'total' => intval($total),
            'page' => $page,
            'per_page' => $per_page,
            'total_pages' => ceil($total / $per_page)
        ));
    }
    
    public function ajax_update_post_field() {
        check_ajax_referer('klyra_beamray_nonce', 'nonce');
        
        $post_id = intval($_POST['post_id']);
        $field = sanitize_text_field($_POST['field']);
        $value = $_POST['value'];
        
        $allowed_fields = array(
            'post_title', 'post_name', 'post_status', 'post_content',
            'post_author', 'post_parent', 'menu_order', 'comment_status', 'ping_status'
        );
        
        if (!in_array($field, $allowed_fields)) {
            wp_send_json_error('Invalid field');
        }
        
        $update_data = array(
            'ID' => $post_id,
            $field => $value
        );
        
        $result = wp_update_post($update_data, true);
        
        if (is_wp_error($result)) {
            wp_send_json_error($result->get_error_message());
        }
        
        wp_send_json_success(array('message' => 'Updated successfully'));
    }
    
    public function ajax_create_post() {
        check_ajax_referer('klyra_beamray_nonce', 'nonce');
        
        $post_data = array(
            'post_title' => sanitize_text_field($_POST['post_title'] ?? 'New Post'),
            'post_content' => wp_kses_post($_POST['post_content'] ?? ''),
            'post_status' => sanitize_text_field($_POST['post_status'] ?? 'draft'),
            'post_type' => sanitize_text_field($_POST['post_type'] ?? 'post'),
            'post_name' => sanitize_text_field($_POST['post_name'] ?? ''),
            'post_parent' => intval($_POST['post_parent'] ?? 0)
        );
        
        $post_id = wp_insert_post($post_data, true);
        
        if (is_wp_error($post_id)) {
            wp_send_json_error($post_id->get_error_message());
        }
        
        wp_send_json_success(array(
            'message' => 'Post created successfully',
            'post_id' => $post_id
        ));
    }
    
    public function ajax_update_post_content() {
        check_ajax_referer('klyra_beamray_nonce', 'nonce');
        
        $post_id = intval($_POST['post_id']);
        $content = wp_kses_post($_POST['content']);
        
        $result = wp_update_post(array(
            'ID' => $post_id,
            'post_content' => $content
        ), true);
        
        if (is_wp_error($result)) {
            wp_send_json_error($result->get_error_message());
        }
        
        wp_send_json_success(array('message' => 'Content updated successfully'));
    }
    
    public function ajax_update_elementor_data() {
        check_ajax_referer('klyra_beamray_nonce', 'nonce');
        
        $post_id = intval($_POST['post_id']);
        $elementor_data = $_POST['elementor_data'];
        
        $result = update_post_meta($post_id, '_elementor_data', $elementor_data);
        
        if ($result === false) {
            wp_send_json_error('Failed to update elementor data');
        }
        
        wp_send_json_success(array('message' => 'Elementor data updated successfully'));
    }
    
    public function ajax_create_auto_numbered_post() {
        check_ajax_referer('klyra_beamray_nonce', 'nonce');
        
        if (!current_user_can('edit_posts')) {
            wp_send_json_error('Insufficient permissions');
            return;
        }
        
        $next_number = $this->get_next_auto_number('post');
        $post_title = "new post {$next_number}";
        
        $post_data = array(
            'post_title' => $post_title,
            'post_content' => '',
            'post_status' => 'draft',
            'post_type' => 'post',
            'post_name' => sanitize_title($post_title)
        );
        
        $post_id = wp_insert_post($post_data, true);
        
        if (is_wp_error($post_id)) {
            wp_send_json_error($post_id->get_error_message());
            return;
        }
        
        wp_send_json_success(array(
            'message' => "Created new post: {$post_title}",
            'post_id' => $post_id,
            'post_title' => $post_title
        ));
    }
    
    public function ajax_create_auto_numbered_page() {
        check_ajax_referer('klyra_beamray_nonce', 'nonce');
        
        if (!current_user_can('edit_pages')) {
            wp_send_json_error('Insufficient permissions');
            return;
        }
        
        $next_number = $this->get_next_auto_number('page');
        $post_title = "new page {$next_number}";
        
        $post_data = array(
            'post_title' => $post_title,
            'post_content' => '',
            'post_status' => 'draft',
            'post_type' => 'page',
            'post_name' => sanitize_title($post_title)
        );
        
        $post_id = wp_insert_post($post_data, true);
        
        if (is_wp_error($post_id)) {
            wp_send_json_error($post_id->get_error_message());
            return;
        }
        
        wp_send_json_success(array(
            'message' => "Created new page: {$post_title}",
            'post_id' => $post_id,
            'post_title' => $post_title
        ));
    }
    
    private function get_next_auto_number($post_type) {
        global $wpdb;
        
        $prefix = "new {$post_type} ";
        $pattern = $prefix . '%';
        
        // Find all posts with titles matching "new post %" or "new page %"
        $results = $wpdb->get_results($wpdb->prepare(
            "SELECT post_title FROM {$wpdb->prefix}posts 
             WHERE post_type = %s 
             AND post_title LIKE %s 
             AND post_status IN ('publish', 'draft', 'private', 'pending')",
            $post_type,
            $pattern
        ));
        
        $max_number = 0;
        
        foreach ($results as $result) {
            $title = $result->post_title;
            
            // Extract number from titles like "new post 5" or "new page 12"
            if (preg_match('/^new ' . preg_quote($post_type, '/') . ' (\d+)$/i', $title, $matches)) {
                $number = intval($matches[1]);
                if ($number > $max_number) {
                    $max_number = $number;
                }
            }
        }
        
        return $max_number + 1;
    }
}