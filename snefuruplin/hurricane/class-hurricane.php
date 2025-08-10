<?php

/**
 * Hurricane Feature for Snefuruplin
 * Adds Hurricane interface element to post/page edit screens
 */

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly
}

class Snefuru_Hurricane {
    
    public function __construct() {
        add_action('add_meta_boxes', array($this, 'add_hurricane_metabox'));
        add_action('admin_enqueue_scripts', array($this, 'enqueue_hurricane_assets'));
        add_action('edit_form_top', array($this, 'add_stellar_chamber'));
    }
    
    /**
     * Add Stellar Chamber element above the title bar
     */
    public function add_stellar_chamber($post) {
        // Only show on post and page edit screens
        if (!in_array($post->post_type, array('post', 'page'))) {
            return;
        }
        ?>
        <div class="snefuru-stellar-chamber">
            <div class="snefuru-stellar-chamber-header">
                <span class="snefuru-stellar-chamber-text">Stellar Chamber</span>
                <svg class="snefuru-rocket-icon" xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 100 100" style="display: inline-block; vertical-align: middle; margin-left: 10px; transform: rotate(-30deg);">
                    <!-- Rocket body -->
                    <path d="M50 10 Q60 20 60 40 L60 55 Q50 65 40 55 L40 40 Q40 20 50 10" fill="#ff6b6b" stroke="#333" stroke-width="2"/>
                    <!-- Rocket tip -->
                    <path d="M50 10 Q55 5 50 0 Q45 5 50 10" fill="#333"/>
                    <!-- Rocket window -->
                    <circle cx="50" cy="30" r="6" fill="#87ceeb" stroke="#333" stroke-width="1"/>
                    <!-- Rocket fins -->
                    <path d="M40 45 L30 55 L35 50 L40 50 Z" fill="#666" stroke="#333" stroke-width="1"/>
                    <path d="M60 45 L70 55 L65 50 L60 50 Z" fill="#666" stroke="#333" stroke-width="1"/>
                    <!-- Fire/flames -->
                    <g class="rocket-flames">
                        <path d="M45 55 Q42 65 43 70 Q45 68 47 70 Q48 65 45 55" fill="#ff9500" opacity="0.9">
                            <animate attributeName="d" 
                                values="M45 55 Q42 65 43 70 Q45 68 47 70 Q48 65 45 55;
                                        M45 55 Q41 66 44 72 Q46 69 48 72 Q49 66 45 55;
                                        M45 55 Q42 65 43 70 Q45 68 47 70 Q48 65 45 55"
                                dur="0.3s" repeatCount="indefinite"/>
                        </path>
                        <path d="M50 55 Q48 68 50 75 Q52 68 50 55" fill="#ff4500" opacity="0.8">
                            <animate attributeName="d" 
                                values="M50 55 Q48 68 50 75 Q52 68 50 55;
                                        M50 55 Q47 70 50 78 Q53 70 50 55;
                                        M50 55 Q48 68 50 75 Q52 68 50 55"
                                dur="0.4s" repeatCount="indefinite"/>
                        </path>
                        <path d="M55 55 Q58 65 57 70 Q55 68 53 70 Q52 65 55 55" fill="#ff9500" opacity="0.9">
                            <animate attributeName="d" 
                                values="M55 55 Q58 65 57 70 Q55 68 53 70 Q52 65 55 55;
                                        M55 55 Q59 66 56 72 Q54 69 52 72 Q51 66 55 55;
                                        M55 55 Q58 65 57 70 Q55 68 53 70 Q52 65 55 55"
                                dur="0.35s" repeatCount="indefinite"/>
                        </path>
                    </g>
                </svg>
            </div>
            <div class="snefuru-stellar-tabs">
                <div class="snefuru-stellar-tab-navigation">
                    <button type="button" class="snefuru-stellar-tab-button active" data-tab="elicitor">
                        Elicitor
                    </button>
                    <button type="button" class="snefuru-stellar-tab-button" data-tab="elementor">
                        Elementor
                    </button>
                    <button type="button" class="snefuru-stellar-tab-button" data-tab="gutenberg">
                        Gutenberg
                    </button>
                    <button type="button" class="snefuru-stellar-tab-button" data-tab="other">
                        Other
                    </button>
                    <button type="button" class="snefuru-stellar-tab-button" data-tab="driggs">
                        Driggs
                    </button>
                    <button type="button" class="snefuru-stellar-tab-button" data-tab="services">
                        Services
                    </button>
                    <button type="button" class="snefuru-stellar-tab-button" data-tab="locations">
                        Locations
                    </button>
                </div>
                <div class="snefuru-stellar-tab-content">
                    <div class="snefuru-stellar-tab-panel active" data-panel="elicitor">
                        <!-- Elicitor content will go here -->
                    </div>
                    <div class="snefuru-stellar-tab-panel" data-panel="elementor">
                        <?php
                        // Generate header303 content
                        $post_id = $post->ID;
                        $post_title = get_the_title($post_id);
                        $post_status = get_post_status($post_id);
                        $edit_link = admin_url('post.php?post=' . $post_id . '&action=edit');
                        
                        // Format the header303 content with two lines
                        $header303_line1 = sprintf(
                            'wp_posts.post_id = %d / %s / %s / %s',
                            $post_id,
                            $post_title,
                            $post_status,
                            $edit_link
                        );
                        $header303_content = $header303_line1 . "\nBELOW";
                        
                        // Get Elementor data for this post
                        $elementor_data = get_post_meta($post->ID, '_elementor_data', true);
                        $formatted_data = '';
                        
                        if (!empty($elementor_data)) {
                            // Decode and pretty print the JSON for better readability
                            $decoded = json_decode($elementor_data, true);
                            if ($decoded !== null) {
                                $formatted_data = json_encode($decoded, JSON_PRETTY_PRINT);
                            } else {
                                $formatted_data = $elementor_data;
                            }
                        }
                        
                        // Static mapping text for header303_db_mapping
                        $db_mapping_text = "wp_posts.ID / wp_posts.post_title / wp_posts.post_status / admin_url('post.php?post=\$ID&action=edit')\n\nDatabase field mappings:\n- Post ID: wp_posts.ID (bigint unsigned, primary key)\n- Post Title: wp_posts.post_title (text field)\n- Post Status: wp_posts.post_status (varchar, values: publish/draft/pending/private/trash/auto-draft/inherit)\n- Edit Link: Dynamically generated using WordPress admin_url() function with wp_posts.ID";
                        ?>
                        
                        <!-- Header303 DB Mapping Container -->
                        <div class="snefuru-header303-db-mapping-container">
                            <div class="snefuru-header303-db-mapping-header">
                                <span class="snefuru-header303-db-mapping-label">header303_db_mapping</span>
                                <button type="button" class="snefuru-copy-btn" data-target="header303-db-mapping-textbox">
                                    Copy
                                </button>
                            </div>
                            <textarea 
                                id="header303-db-mapping-textbox" 
                                class="snefuru-header303-db-mapping-textbox" 
                                readonly
                            ><?php echo esc_textarea($db_mapping_text); ?></textarea>
                        </div>
                        
                        <!-- Header303 Container -->
                        <div class="snefuru-header303-container">
                            <div class="snefuru-header303-header">
                                <span class="snefuru-header303-label">header303</span>
                                <button type="button" class="snefuru-copy-btn" data-target="header303-textbox">
                                    Copy
                                </button>
                            </div>
                            <textarea 
                                id="header303-textbox" 
                                class="snefuru-header303-textbox" 
                                readonly
                            ><?php echo esc_textarea($header303_content); ?></textarea>
                        </div>
                        
                        <!-- Elementor Data Container -->
                        <div class="snefuru-elementor-data-container">
                            <div class="snefuru-elementor-data-header">
                                <span class="snefuru-elementor-data-label">_elementor_data</span>
                                <button type="button" class="snefuru-copy-btn" data-target="elementor-data-textbox">
                                    Copy
                                </button>
                            </div>
                            <textarea 
                                id="elementor-data-textbox" 
                                class="snefuru-elementor-data-textbox" 
                                readonly
                                placeholder="No Elementor data found for this page"
                            ><?php echo esc_textarea($formatted_data); ?></textarea>
                        </div>
                    </div>
                    <div class="snefuru-stellar-tab-panel" data-panel="gutenberg">
                        <!-- Gutenberg content will go here -->
                    </div>
                    <div class="snefuru-stellar-tab-panel" data-panel="other">
                        <!-- Other content will go here -->
                    </div>
                    <div class="snefuru-stellar-tab-panel" data-panel="driggs">
                        <!-- Driggs content will go here -->
                    </div>
                    <div class="snefuru-stellar-tab-panel" data-panel="services">
                        <h2 class="snefuru-kepler-title">Kepler Services</h2>
                        <!-- Services content will go here -->
                    </div>
                    <div class="snefuru-stellar-tab-panel" data-panel="locations">
                        <h2 class="snefuru-kepler-title">Kepler Locations</h2>
                        <?php
                        // Generate the admin URL for rup_locations_mar
                        $locations_url = admin_url('admin.php?page=rup_locations_mar');
                        ?>
                        <div class="snefuru-locations-button-container">
                            <a href="<?php echo esc_url($locations_url); ?>" class="snefuru-locations-main-btn">
                                ?page=rup_locations_mar
                            </a>
                            <button type="button" class="snefuru-locations-copy-btn" data-copy-url="<?php echo esc_attr($locations_url); ?>" title="Copy link to clipboard">
                                📋
                            </button>
                        </div>
                        <!-- Additional locations content will go here -->
                    </div>
                </div>
            </div>
        </div>
        <?php
    }
    
    /**
     * Add Hurricane metabox to post/page edit screens
     */
    public function add_hurricane_metabox() {
        // Get current screen
        $screen = get_current_screen();
        
        // Only add to post and page edit screens
        if ($screen && in_array($screen->base, array('post')) && in_array($screen->post_type, array('post', 'page'))) {
            add_meta_box(
                'snefuru-hurricane',
                'Hurricane',
                array($this, 'render_hurricane_metabox'),
                array('post', 'page'),
                'side', // This places it in the sidebar (right side)
                'high'  // This places it at the top of the sidebar
            );
        }
    }
    
    /**
     * Render the Hurricane metabox content
     */
    public function render_hurricane_metabox($post) {
        ?>
        <div class="snefuru-hurricane-container">
            <div class="snefuru-hurricane-content">
                Hurricane
            </div>
            <div class="snefuru-hurricane-controls">
                <button type="button" class="button button-primary snefuru-lightning-popup-btn" onclick="window.snefuruOpenLightningPopup()">
                    ⚡ Lightning Popup
                </button>
            </div>
        </div>
        
        <!-- Lightning Popup Modal -->
        <div id="snefuru-lightning-popup" class="snefuru-popup-overlay" style="display: none;">
            <div class="snefuru-popup-container">
                <div class="snefuru-popup-header">
                    <h2 class="snefuru-popup-title">Lightning Popup</h2>
                    <button type="button" class="snefuru-popup-close" onclick="window.snefuruCloseLightningPopup()">&times;</button>
                </div>
                <div class="snefuru-popup-content">
                    <!-- Future content will go here -->
                </div>
            </div>
        </div>
        <?php
    }
    
    /**
     * Enqueue Hurricane CSS and JS assets
     */
    public function enqueue_hurricane_assets($hook) {
        // Only load on post/page edit screens
        if (!in_array($hook, array('post.php', 'post-new.php'))) {
            return;
        }
        
        // Get current screen to check post type
        $screen = get_current_screen();
        if (!$screen || !in_array($screen->post_type, array('post', 'page'))) {
            return;
        }
        
        wp_enqueue_style(
            'snefuru-hurricane-css',
            SNEFURU_PLUGIN_URL . 'hurricane/assets/hurricane.css',
            array(),
            SNEFURU_PLUGIN_VERSION
        );
        
        wp_enqueue_script(
            'snefuru-hurricane-js',
            SNEFURU_PLUGIN_URL . 'hurricane/assets/hurricane.js',
            array('jquery'),
            SNEFURU_PLUGIN_VERSION,
            true
        );
        
        // Add inline script to test if assets are loading
        wp_add_inline_script('snefuru-hurricane-js', '
            console.log("Hurricane JS loaded successfully");
            console.log("jQuery version:", jQuery.fn.jquery);
        ');
        
        // Localize script with AJAX URL and nonce
        wp_localize_script('snefuru-hurricane-js', 'snefuruHurricane', array(
            'ajaxurl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('snefuru_hurricane_nonce'),
            'post_id' => get_the_ID()
        ));
    }
}