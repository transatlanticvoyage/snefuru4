<?php

if (!defined('ABSPATH')) {
    exit;
}

function klyra_beamraymar_render_page() {
    global $wpdb;
    
    $admin = new Klyra_Admin();
    $admin->suppress_all_admin_notices();
    
    $sitespren_base = '';
    $table_exists = $wpdb->get_var("SHOW TABLES LIKE '{$wpdb->prefix}zen_sitespren'");
    if ($table_exists) {
        $sitespren_base = $wpdb->get_var("SELECT sitespren_base FROM {$wpdb->prefix}zen_sitespren WHERE wppma_id = 1");
    }
    
    ?>
    <div class="wrap klyra-beamray-wrapper">
        <div style="height: 20px;"></div>
        
        <div style="padding: 20px;">
            <div style="display: flex; align-items: center; gap: 20px; margin-bottom: 15px;">
                <div style="font-size: 16px; font-weight: bold; text-transform: lowercase;">
                    <span style="font-weight: bold;"><?php echo esc_html($wpdb->prefix); ?></span>zen_sitespren.sitespren_base: <?php echo esc_html($sitespren_base ?: ''); ?>
                </div>
                <div style="border: 1px solid gray; padding: 10px; display: flex; align-items: center; gap: 15px;">
                    <span style="font-size: 16px; font-weight: bold;">phrenozoic_chamber</span>
                    <span style="font-size: 16px; font-weight: bold;">post_type</span>
                    <div style="display: flex; gap: 0;">
                        <button type="button" data-posttype="all" class="klyra-posttype-filter-btn active" style="padding: 8px 12px; font-size: 14px; border: 1px solid #3B82F6; background: #3B82F6; color: white; border-radius: 4px 0 0 4px; cursor: pointer;">all</button>
                        <button type="button" data-posttype="page" class="klyra-posttype-filter-btn" style="padding: 8px 12px; font-size: 14px; border: 1px solid #D1D5DB; margin-left: -1px; background: white; cursor: pointer;">page</button>
                        <button type="button" data-posttype="post" class="klyra-posttype-filter-btn" style="padding: 8px 12px; font-size: 14px; border: 1px solid #D1D5DB; margin-left: -1px; border-radius: 0 4px 4px 0; background: white; cursor: pointer;">post</button>
                    </div>
                </div>
                <div style="border: 1px solid gray; padding: 10px; display: flex; align-items: center; gap: 15px;">
                    <span style="font-size: 16px; font-weight: bold;">venlazoic_chamber</span>
                </div>
            </div>
            <div style="display: flex; align-items: center; margin-bottom: 20px;">
                <img src="<?php echo KLYRA_PLUGIN_URL . 'klyra-shenzi-asset-mirror/beamraymar-logo-1.png'; ?>" alt="BeamRaymar Logo" style="height: 70px; width: auto; margin-right: 15px;">
                <h1 style="margin: 0; margin-right: 20px;">Klyra BeamRay Table</h1>
                <div style="border: 1px solid gray; padding: 10px; display: flex; align-items: center; gap: 15px;">
                    <span style="font-size: 16px; font-weight: bold;">protozoic_chamber</span>
                    <span style="font-size: 16px; font-weight: bold;">assigned service page</span>
                    <div style="display: flex; gap: 0; align-items: center;">
                        <button type="button" id="klyra-service-prev" style="padding: 8px; font-size: 14px; border: 1px solid #D1D5DB; border-radius: 4px 0 0 4px; cursor: pointer; background: white; margin-right: -1px;">
                            <svg style="width: 16px; height: 16px; color: #6B7280;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                                <path d="M1 4v6h6" />
                                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                            </svg>
                        </button>
                        <button type="button" data-filter="all" class="klyra-service-filter-btn active" style="padding: 8px 12px; font-size: 14px; border: 1px solid #3B82F6; background: #3B82F6; color: white; cursor: pointer; margin-left: -1px;">all</button>
                        <button type="button" data-filter="assigned" class="klyra-service-filter-btn" style="padding: 8px 12px; font-size: 14px; border: 1px solid #D1D5DB; margin-left: -1px; background: white; cursor: pointer;">assigned only</button>
                        <button type="button" data-filter="non-assigned" class="klyra-service-filter-btn" style="padding: 8px 12px; font-size: 14px; border: 1px solid #D1D5DB; margin-left: -1px; background: white; cursor: pointer;">non-assigned only</button>
                        <button type="button" id="klyra-service-next" style="padding: 8px; font-size: 14px; border: 1px solid #D1D5DB; border-radius: 0 4px 4px 0; cursor: pointer; background: white; margin-left: -1px;">
                            <svg style="width: 16px; height: 16px; color: #6B7280;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                                <path d="M23 4v6h-6" />
                                <path d="M20.49 15a9 9 0 1 1-2.13-9.36L23 10" />
                            </svg>
                        </button>
                    </div>
                    <span style="font-size: 16px; font-weight: bold;">icepick:</span>
                    <div style="display: flex; gap: 0; align-items: center;">
                        <button type="button" id="klyra-icepick-prev" style="padding: 8px; font-size: 14px; border: 1px solid #D1D5DB; border-radius: 4px 0 0 4px; cursor: pointer; background: white; margin-right: -1px;">
                            <svg style="width: 16px; height: 16px; color: #6B7280;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                                <path d="M1 4v6h6" />
                                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                            </svg>
                        </button>
                        <button type="button" data-icepick="all" class="klyra-icepick-filter-btn active" style="padding: 8px 12px; font-size: 14px; border: 1px solid #3B82F6; background: #3B82F6; color: white; cursor: pointer; margin-left: -1px;">all</button>
                        <button type="button" data-icepick="home" class="klyra-icepick-filter-btn" style="padding: 8px 12px; font-size: 14px; border: 1px solid #D1D5DB; margin-left: -1px; background: white; cursor: pointer;">home</button>
                        <button type="button" data-icepick="blog" class="klyra-icepick-filter-btn" style="padding: 8px 12px; font-size: 14px; border: 1px solid #D1D5DB; margin-left: -1px; background: white; cursor: pointer;">blog</button>
                        <button type="button" data-icepick="assigned" class="klyra-icepick-filter-btn" style="padding: 8px 12px; font-size: 14px; border: 1px solid #D1D5DB; margin-left: -1px; background: white; cursor: pointer;">assigned only</button>
                        <button type="button" data-icepick="others" class="klyra-icepick-filter-btn" style="padding: 8px 12px; font-size: 14px; border: 1px solid #D1D5DB; margin-left: -1px; background: white; cursor: pointer;">others</button>
                        <button type="button" id="klyra-icepick-next" style="padding: 8px; font-size: 14px; border: 1px solid #D1D5DB; border-radius: 0 4px 4px 0; cursor: pointer; background: white; margin-left: -1px;">
                            <svg style="width: 16px; height: 16px; color: #6B7280;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                                <path d="M23 4v6h-6" />
                                <path d="M20.49 15a9 9 0 1 1-2.13-9.36L23 10" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
            
            <div style="background: white; border: 1px solid #ddd; padding: 15px; margin-bottom: 20px; border-radius: 5px;">
                <div style="display: flex; align-items: center; gap: 10px; justify-content: space-between;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span style="font-size: 16px; font-weight: bold;">mandible_chamber</span>
                        <button id="klyra-create-post-btn" class="button button-primary">Create New Post</button>
                        <button id="klyra-create-page-btn" class="button button-primary">Create New Page</button>
                        <a href="<?php echo admin_url('admin.php?page=grove_services_mar'); ?>" class="button button-secondary" style="text-decoration: none;">/grove_services_mar</a>
                        <span style="font-size: 16px; font-weight: bold;">post_status</span>
                        <div style="display: inline-flex; border-radius: 6px; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);">
                            <button type="button" data-status="all" class="klyra-status-filter-btn" style="padding: 8px 12px; font-size: 14px; border: 1px solid #D1D5DB; border-radius: 6px 0 0 6px; margin-right: -1px; cursor: pointer; background: white;">all</button>
                            <button type="button" data-status="publish" class="klyra-status-filter-btn active" style="padding: 8px 12px; font-size: 14px; border: 1px solid #3B82F6; background: #3B82F6; color: white; margin-right: -1px; cursor: pointer;">published</button>
                            <button type="button" data-status="draft" class="klyra-status-filter-btn" style="padding: 8px 12px; font-size: 14px; border: 1px solid #D1D5DB; border-radius: 0 6px 6px 0; cursor: pointer; background: white;">draft</button>
                        </div>
                        <span style="font-size: 16px; font-weight: bold;">page_kennel</span>
                        <div style="display: inline-flex; border-radius: 6px; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);">
                            <button type="button" data-kennel="all" class="klyra-kennel-filter-btn active" style="padding: 8px 12px; font-size: 14px; border: 1px solid #3B82F6; background: #3B82F6; color: white; border-radius: 6px 0 0 0; margin-right: -1px; cursor: pointer;">all</button>
                            <button type="button" data-kennel="home" class="klyra-kennel-filter-btn" style="padding: 8px 12px; font-size: 14px; border: 1px solid #D1D5DB; margin-right: -1px; cursor: pointer; background: white;">home</button>
                            <button type="button" data-kennel="service" class="klyra-kennel-filter-btn" style="padding: 8px 12px; font-size: 14px; border: 1px solid #D1D5DB; margin-right: -1px; cursor: pointer; background: white;">service</button>
                            <button type="button" data-kennel="location" class="klyra-kennel-filter-btn" style="padding: 8px 12px; font-size: 14px; border: 1px solid #D1D5DB; margin-right: -1px; cursor: pointer; background: white;">location</button>
                            <button type="button" data-kennel="other" class="klyra-kennel-filter-btn" style="padding: 8px 12px; font-size: 14px; border: 1px solid #D1D5DB; border-radius: 0 6px 6px 0; cursor: pointer; background: white;">other</button>
                        </div>
                        <span style="font-size: 16px; font-weight: bold; margin-left: 20px;">With Selected:</span>
                        <select id="klyra-bulk-action" style="padding: 8px 12px; font-size: 14px; border: 1px solid #D1D5DB; margin-left: 8px; background: white;">
                            <option value="">Choose action...</option>
                            <option value="publish">update post_status to publish</option>
                            <option value="draft">update post_status to draft</option>
                            <option value="trash">move to trash</option>
                            <option value="duplicate">duplicate</option>
                        </select>
                        <button type="button" id="klyra-bulk-submit" style="padding: 8px 16px; font-size: 14px; border: 1px solid #3B82F6; background: #3B82F6; color: white; margin-left: 8px; cursor: pointer; border-radius: 4px;">submit</button>
                    </div>
                </div>
            </div>
            
            <div class="rocket_chamber_div" style="border: 1px solid black; padding: 0; margin: 20px 0; position: relative;">
                <div style="position: absolute; top: 4px; left: 4px; font-size: 16px; font-weight: bold; display: flex; align-items: center; gap: 6px;">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="black" style="transform: rotate(15deg);">
                        <ellipse cx="12" cy="8" rx="3" ry="6" fill="black"/>
                        <path d="M12 2 L15 8 L9 8 Z" fill="black"/>
                        <path d="M9 12 L7 14 L9 16 Z" fill="black"/>
                        <path d="M15 12 L17 14 L15 16 Z" fill="black"/>
                        <path d="M10 14 L9 18 L10.5 16 L12 20 L13.5 16 L15 18 L14 14 Z" fill="black"/>
                        <circle cx="12" cy="6" r="1" fill="white"/>
                    </svg>
                    rocket_chamber
                    
                    <!-- Tool Buttons Toggle Switch -->
                    <div style="display: flex; align-items: center; gap: 8px; margin-left: 20px;">
                        <div class="klyra-toggle-switch" id="tool-buttons-toggle" style="position: relative; width: 50px; height: 24px; background: #4CAF50; border-radius: 12px; cursor: pointer; transition: background 0.3s;">
                            <div class="klyra-toggle-knob" style="position: absolute; top: 2px; right: 2px; width: 20px; height: 20px; background: white; border-radius: 50%; transition: all 0.3s; box-shadow: 0 2px 4px rgba(0,0,0,0.2);"></div>
                        </div>
                        <span style="font-size: 16px; font-weight: bold;">tool_buttons</span>
                    </div>
                    
                    <!-- ID Toggle Switch -->
                    <div style="display: flex; align-items: center; gap: 8px; margin-left: 20px;">
                        <div class="klyra-toggle-switch" id="id-toggle" style="position: relative; width: 50px; height: 24px; background: #4CAF50; border-radius: 12px; cursor: pointer; transition: background 0.3s;">
                            <div class="klyra-toggle-knob" style="position: absolute; top: 2px; right: 2px; width: 20px; height: 20px; background: white; border-radius: 50%; transition: all 0.3s; box-shadow: 0 2px 4px rgba(0,0,0,0.2);"></div>
                        </div>
                        <span style="font-size: 16px; font-weight: bold;">id</span>
                    </div>
                    
                    <!-- Post Status Toggle Switch -->
                    <div style="display: flex; align-items: center; gap: 8px; margin-left: 20px;">
                        <div class="klyra-toggle-switch" id="post-status-toggle" style="position: relative; width: 50px; height: 24px; background: #4CAF50; border-radius: 12px; cursor: pointer; transition: background 0.3s;">
                            <div class="klyra-toggle-knob" style="position: absolute; top: 2px; right: 2px; width: 20px; height: 20px; background: white; border-radius: 50%; transition: all 0.3s; box-shadow: 0 2px 4px rgba(0,0,0,0.2);"></div>
                        </div>
                        <span style="font-size: 16px; font-weight: bold;">post_status</span>
                    </div>
                    
                    <!-- Combo Title Name Toggle Switch -->
                    <div style="display: flex; align-items: center; gap: 8px; margin-left: 20px;">
                        <div class="klyra-toggle-switch" id="combo-title-name-toggle" style="position: relative; width: 50px; height: 24px; background: #4CAF50; border-radius: 12px; cursor: pointer; transition: background 0.3s;">
                            <div class="klyra-toggle-knob" style="position: absolute; top: 2px; right: 2px; width: 20px; height: 20px; background: white; border-radius: 50%; transition: all 0.3s; box-shadow: 0 2px 4px rgba(0,0,0,0.2);"></div>
                        </div>
                        <span style="font-size: 16px; font-weight: bold;">combo title name</span>
                    </div>
                    
                    <!-- Post Title Toggle Switch -->
                    <div style="display: flex; align-items: center; gap: 8px; margin-left: 20px;">
                        <div class="klyra-toggle-switch" id="post-title-toggle" style="position: relative; width: 50px; height: 24px; background: #4CAF50; border-radius: 12px; cursor: pointer; transition: background 0.3s;">
                            <div class="klyra-toggle-knob" style="position: absolute; top: 2px; right: 2px; width: 20px; height: 20px; background: white; border-radius: 50%; transition: all 0.3s; box-shadow: 0 2px 4px rgba(0,0,0,0.2);"></div>
                        </div>
                        <span style="font-size: 16px; font-weight: bold;">post_title</span>
                    </div>
                    
                    <!-- Post Name Toggle Switch -->
                    <div style="display: flex; align-items: center; gap: 8px; margin-left: 20px;">
                        <div class="klyra-toggle-switch" id="post-name-toggle" style="position: relative; width: 50px; height: 24px; background: #4CAF50; border-radius: 12px; cursor: pointer; transition: background 0.3s;">
                            <div class="klyra-toggle-knob" style="position: absolute; top: 2px; right: 2px; width: 20px; height: 20px; background: white; border-radius: 50%; transition: all 0.3s; box-shadow: 0 2px 4px rgba(0,0,0,0.2);"></div>
                        </div>
                        <span style="font-size: 16px; font-weight: bold;">post_name</span>
                    </div>
                </div>
                <div style="margin-top: 24px; padding-top: 4px; padding-bottom: 0; padding-left: 8px; padding-right: 8px;">
                    <div style="display: flex; align-items: end; justify-content: space-between;">
                        <div style="display: flex; align-items: end; gap: 32px;">
                            <table style="border-collapse: collapse;">
                                <tbody>
                                    <tr>
                                        <td style="border: 1px solid black; padding: 4px; text-align: center;">
                                            <div style="font-size: 16px; display: flex; align-items: center; justify-content: center; gap: 8px;">
                                                <span style="font-weight: bold;">row pagination</span>
                                                <span style="font-size: 14px; font-weight: normal;">
                                                    Showing <span style="font-weight: bold;" id="klyra-showing">0</span> of <span style="font-weight: bold;" id="klyra-total">0</span> posts/pages
                                                </span>
                                            </div>
                                        </td>
                                        <td style="border: 1px solid black; padding: 4px; text-align: center;">
                                            <div style="font-size: 16px; font-weight: bold;">
                                                search box 2
                                            </div>
                                        </td>
                                        <td style="border: 1px solid black; padding: 4px; text-align: center;">
                                            <div style="font-size: 16px; font-weight: bold;">
                                                wolf exclusion band
                                            </div>
                                        </td>
                                        <td style="border: 1px solid black; padding: 4px; text-align: center;">
                                            <div style="font-size: 16px; font-weight: bold;">
                                                column templates
                                            </div>
                                        </td>
                                        <td style="border: 1px solid black; padding: 4px; text-align: center;">
                                            <div style="font-size: 16px; display: flex; align-items: center; justify-content: center; gap: 8px;">
                                                <span style="font-weight: bold;">column pagination</span>
                                                <span style="font-size: 14px; font-weight: normal;">
                                                    Showing <span style="font-weight: bold;" id="klyra-columns-showing">8</span> columns of <span style="font-weight: bold;">28</span> total columns
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="border: 1px solid black; padding: 4px;">
                                            <div style="display: flex; align-items: end; gap: 16px;">
                                                <div style="display: flex; align-items: center;">
                                                    <span style="font-size: 12px; color: #4B5563; margin-right: 8px;">Rows/page:</span>
                                                    <div style="display: inline-flex; border-radius: 6px; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);">
                                                        <button type="button" data-rows="8" class="klyra-rows-per-page-btn active" style="padding: 10px 8px; font-size: 14px; border: 1px solid #3B82F6; background: #3B82F6; color: white; border-radius: 6px 0 0 6px; margin-right: -1px; cursor: pointer;">8</button>
                                                        <button type="button" data-rows="10" class="klyra-rows-per-page-btn" style="padding: 10px 8px; font-size: 14px; border: 1px solid #D1D5DB; margin-right: -1px; cursor: pointer; background: white;">10</button>
                                                        <button type="button" data-rows="25" class="klyra-rows-per-page-btn" style="padding: 10px 8px; font-size: 14px; border: 1px solid #D1D5DB; margin-right: -1px; cursor: pointer; background: white;">25</button>
                                                        <button type="button" data-rows="50" class="klyra-rows-per-page-btn" style="padding: 10px 8px; font-size: 14px; border: 1px solid #D1D5DB; margin-right: -1px; cursor: pointer; background: white;">50</button>
                                                        <button type="button" data-rows="100" class="klyra-rows-per-page-btn" style="padding: 10px 8px; font-size: 14px; border: 1px solid #D1D5DB; margin-right: -1px; cursor: pointer; background: white;">100</button>
                                                        <button type="button" data-rows="200" class="klyra-rows-per-page-btn" style="padding: 10px 8px; font-size: 14px; border: 1px solid #D1D5DB; margin-right: -1px; cursor: pointer; background: white;">200</button>
                                                        <button type="button" data-rows="all" class="klyra-rows-per-page-btn" style="padding: 10px 8px; font-size: 14px; border: 1px solid #D1D5DB; border-radius: 0 6px 6px 0; cursor: pointer; background: white;">All</button>
                                                    </div>
                                                </div>
                                                <div style="display: flex; align-items: center;">
                                                    <span style="font-size: 12px; color: #4B5563; margin-right: 8px;">Row page:</span>
                                                    <nav style="display: inline-flex; border-radius: 6px; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);">
                                                        <button type="button" id="klyra-first-row-page" style="position: relative; display: inline-flex; align-items: center; border-radius: 6px 0 0 0; padding: 8px; font-size: 14px; padding-top: 10px; padding-bottom: 10px; color: #9CA3AF; border: 1px solid #D1D5DB; cursor: pointer; background: white;">≪</button>
                                                        <button type="button" id="klyra-prev-row-page" style="position: relative; display: inline-flex; align-items: center; padding: 8px; font-size: 14px; padding-top: 10px; padding-bottom: 10px; color: #9CA3AF; border: 1px solid #D1D5DB; margin-left: -1px; cursor: pointer; background: white;">
                                                            <svg style="width: 16px; height: 16px; color: #6B7280;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                                                                <path d="M1 4v6h6" />
                                                                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                                                            </svg>
                                                        </button>
                                                        <span style="position: relative; display: inline-flex; align-items: center; padding: 8px 12px; font-size: 14px; padding-top: 10px; padding-bottom: 10px; border: 1px solid #D1D5DB; margin-left: -1px; background: white; font-weight: bold;"><span id="klyra-current-row-page">1</span> of <span id="klyra-total-row-pages">1</span></span>
                                                        <button type="button" id="klyra-next-row-page" style="position: relative; display: inline-flex; align-items: center; padding: 8px; font-size: 14px; padding-top: 10px; padding-bottom: 10px; color: #9CA3AF; border: 1px solid #D1D5DB; margin-left: -1px; cursor: pointer; background: white;">
                                                            <svg style="width: 16px; height: 16px; color: #6B7280;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                                                                <path d="M23 4v6h-6" />
                                                                <path d="M20.49 15a9 9 0 1 1-2.13-9.36L23 10" />
                                                            </svg>
                                                        </button>
                                                        <button type="button" id="klyra-last-row-page" style="position: relative; display: inline-flex; align-items: center; border-radius: 0 6px 6px 0; padding: 8px; font-size: 14px; padding-top: 10px; padding-bottom: 10px; color: #9CA3AF; border: 1px solid #D1D5DB; margin-left: -1px; cursor: pointer; background: white;">≫</button>
                                                    </nav>
                                                </div>
                                            </div>
                                        </td>
                                        <td style="border: 1px solid black; padding: 4px;">
                                            <div style="display: flex; align-items: end;">
                                                <input type="text" id="klyra-search" placeholder="Search posts..." style="width: 200px; margin-bottom: 3px; padding: 8px 12px; border: 1px solid #D1D5DB; border-radius: 4px; font-size: 14px; background: white; outline: none; transition: all 0.15s ease;">
                                            </div>
                                        </td>
                                        <td style="border: 1px solid black; padding: 4px;">
                                            <button type="button" id="klyra-wolf-options" style="background: #2563EB; color: white; font-weight: 500; padding: 8px 16px; border-radius: 6px; font-size: 14px; transition: background-color 0.15s ease; border: none; cursor: pointer;" onMouseOver="this.style.background='#1D4ED8'" onMouseOut="this.style.background='#2563EB'">
                                                wolf options
                                            </button>
                                        </td>
                                        <td style="border: 1px solid black; padding: 4px;">
                                            <button type="button" id="klyra-column-templates" style="background: #7C3AED; color: white; font-weight: 500; padding: 8px 16px; border-radius: 6px; font-size: 14px; transition: background-color 0.15s ease; border: none; cursor: pointer;">
                                                use the pillarshift coltemp system
                                            </button>
                                        </td>
                                        <td style="border: 1px solid black; padding: 4px;">
                                            <div style="display: flex; align-items: end; gap: 16px;">
                                                <div style="display: flex; align-items: center;">
                                                    <span style="font-size: 12px; color: #4B5563; margin-right: 8px;">Cols/page:</span>
                                                    <button type="button" data-cols="6" class="klyra-cols-per-page-btn" style="padding: 10px 8px; font-size: 14px; padding-top: 10px; padding-bottom: 10px; border: 1px solid #000; border-radius: 4px 0 0 4px; margin-right: -1px; cursor: pointer; background: white;">6</button>
                                                    <button type="button" data-cols="8" class="klyra-cols-per-page-btn active" style="padding: 10px 8px; font-size: 14px; padding-top: 10px; padding-bottom: 10px; border: 1px solid #000; margin-right: -1px; cursor: pointer; background: #f8f782; color: black;">8</button>
                                                    <button type="button" data-cols="11" class="klyra-cols-per-page-btn" style="padding: 10px 8px; font-size: 14px; padding-top: 10px; padding-bottom: 10px; border: 1px solid #000; margin-right: -1px; cursor: pointer; background: white;">11</button>
                                                    <button type="button" data-cols="15" class="klyra-cols-per-page-btn" style="padding: 10px 8px; font-size: 14px; padding-top: 10px; padding-bottom: 10px; border: 1px solid #000; margin-right: -1px; cursor: pointer; background: white;">15</button>
                                                    <button type="button" data-cols="all" class="klyra-cols-per-page-btn" style="padding: 10px 8px; font-size: 14px; padding-top: 10px; padding-bottom: 10px; border: 1px solid #000; border-radius: 0 4px 4px 0; cursor: pointer; background: white;">All</button>
                                                </div>
                                                <div style="display: flex; align-items: center;">
                                                    <span style="font-size: 12px; color: #4B5563; margin-right: 8px;">Col page:</span>
                                                    <button type="button" id="klyra-first-col-page" style="padding: 8px; font-size: 14px; padding-top: 10px; padding-bottom: 10px; border: 1px solid #000; border-radius: 4px 0 0 4px; margin-right: -1px; cursor: pointer; background: white;">≪</button>
                                                    <button type="button" id="klyra-prev-col-page" style="padding: 8px; font-size: 14px; padding-top: 10px; padding-bottom: 10px; border: 1px solid #000; margin-right: -1px; cursor: pointer; background: white;">
                                                        <svg style="width: 16px; height: 16px; color: #6B7280;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                                                            <path d="M1 4v6h6" />
                                                            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                                                        </svg>
                                                    </button>
                                                    <span style="padding: 8px 12px; font-size: 14px; padding-top: 10px; padding-bottom: 10px; border: 1px solid #000; margin-right: -1px; background: white; font-weight: bold; display: inline-flex; align-items: center;"><span id="klyra-current-col-page">1</span> of <span id="klyra-total-col-pages">4</span></span>
                                                    <button type="button" id="klyra-next-col-page" style="padding: 8px; font-size: 14px; padding-top: 10px; padding-bottom: 10px; border: 1px solid #000; margin-right: -1px; cursor: pointer; background: white;">
                                                        <svg style="width: 16px; height: 16px; color: #6B7280;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                                                            <path d="M23 4v6h-6" />
                                                            <path d="M20.49 15a9 9 0 1 1-2.13-9.36L23 10" />
                                                        </svg>
                                                    </button>
                                                    <button type="button" id="klyra-last-col-page" style="padding: 8px; font-size: 14px; padding-top: 10px; padding-bottom: 10px; border: 1px solid #000; border-radius: 0 4px 4px 0; cursor: pointer; background: white;">≫</button>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
            
            <div style="background: white; border: 1px solid #ddd; border-radius: 5px; overflow: hidden;">
                <div style="overflow-x: auto;">
                    <table id="klyra-beamray-table" class="klyra-table">
                        <thead>
                            <tr class="shenfur_db_table_name_tr">
                                <th class="for_db_table_checkbox"><div class="cell_inner_wrapper_div for_db_table_checkbox"></div></th>
                                <th class="for_db_table_misc"><div class="cell_inner_wrapper_div for_db_table_misc">misc</div></th>
                                <!-- wp_posts columns -->
                                <th class="for_db_table_wp_posts"><div class="cell_inner_wrapper_div for_db_table_wp_posts"><strong>wp_posts</strong></div></th>
                                <th class="for_db_table_wp_posts"><div class="cell_inner_wrapper_div for_db_table_wp_posts"><strong>wp_posts</strong></div></th>
                                <th class="for_db_table_wp_posts"><div class="cell_inner_wrapper_div for_db_table_wp_posts"><strong>wp_posts</strong></div></th>
                                <th class="for_db_table_wp_posts"><div class="cell_inner_wrapper_div for_db_table_wp_posts"><strong>wp_posts</strong></div></th>
                                <th class="for_db_table_wp_posts"><div class="cell_inner_wrapper_div for_db_table_wp_posts"><strong>wp_posts</strong></div></th>
                                <th class="for_db_table_wp_posts"><div class="cell_inner_wrapper_div for_db_table_wp_posts"><strong>wp_posts</strong></div></th>
                                <th class="for_db_table_wp_posts"><div class="cell_inner_wrapper_div for_db_table_wp_posts"><strong>wp_posts</strong></div></th>
                                <th class="for_db_table_wp_posts"><div class="cell_inner_wrapper_div for_db_table_wp_posts"><strong>wp_posts</strong></div></th>
                                <th class="for_db_table_wp_posts"><div class="cell_inner_wrapper_div for_db_table_wp_posts"><strong>wp_posts</strong></div></th>
                                <th class="for_db_table_wp_posts"><div class="cell_inner_wrapper_div for_db_table_wp_posts"><strong>wp_posts</strong></div></th>
                                <th class="for_db_table_wp_posts"><div class="cell_inner_wrapper_div for_db_table_wp_posts"><strong>wp_posts</strong></div></th>
                                <th class="for_db_table_wp_posts"><div class="cell_inner_wrapper_div for_db_table_wp_posts"><strong>wp_posts</strong></div></th>
                                <th class="for_db_table_wp_posts"><div class="cell_inner_wrapper_div for_db_table_wp_posts"><strong>wp_posts</strong></div></th>
                                <th class="for_db_table_wp_posts"><div class="cell_inner_wrapper_div for_db_table_wp_posts"><strong>wp_posts</strong></div></th>
                                <!-- wp_postmeta column -->
                                <th class="for_db_table_wp_postmeta"><div class="cell_inner_wrapper_div for_db_table_wp_postmeta"><strong>wp_postmeta</strong></div></th>
                                <!-- wp_zen_orbitposts columns -->
                                <th class="for_db_table_wp_zen_orbitposts"><div class="cell_inner_wrapper_div for_db_table_wp_zen_orbitposts"><strong>wp_zen_orbitposts</strong></div></th>
                                <th class="for_db_table_wp_zen_orbitposts"><div class="cell_inner_wrapper_div for_db_table_wp_zen_orbitposts"><strong>wp_zen_orbitposts</strong></div></th>
                                <th class="for_db_table_wp_zen_orbitposts"><div class="cell_inner_wrapper_div for_db_table_wp_zen_orbitposts"><strong>wp_zen_orbitposts</strong></div></th>
                                <th class="for_db_table_wp_zen_orbitposts"><div class="cell_inner_wrapper_div for_db_table_wp_zen_orbitposts"><strong>wp_zen_orbitposts</strong></div></th>
                                <th class="for_db_table_wp_zen_orbitposts"><div class="cell_inner_wrapper_div for_db_table_wp_zen_orbitposts"><strong>wp_zen_orbitposts</strong></div></th>
                                <th class="for_db_table_wp_zen_orbitposts"><div class="cell_inner_wrapper_div for_db_table_wp_zen_orbitposts"><strong>wp_zen_orbitposts</strong></div></th>
                                <th class="for_db_table_wp_zen_orbitposts"><div class="cell_inner_wrapper_div for_db_table_wp_zen_orbitposts"><strong>wp_zen_orbitposts</strong></div></th>
                                <th class="for_db_table_wp_zen_orbitposts"><div class="cell_inner_wrapper_div for_db_table_wp_zen_orbitposts"><strong>wp_zen_orbitposts</strong></div></th>
                                <th class="for_db_table_wp_zen_orbitposts"><div class="cell_inner_wrapper_div for_db_table_wp_zen_orbitposts"><strong>wp_zen_orbitposts</strong></div></th>
                                <th class="for_db_table_wp_zen_orbitposts"><div class="cell_inner_wrapper_div for_db_table_wp_zen_orbitposts"><strong>wp_zen_orbitposts</strong></div></th>
                                <th class="for_db_table_wp_zen_orbitposts"><div class="cell_inner_wrapper_div for_db_table_wp_zen_orbitposts"><strong>wp_zen_orbitposts</strong></div></th>
                                <th class="for_db_table_wp_zen_orbitposts"><div class="cell_inner_wrapper_div for_db_table_wp_zen_orbitposts"><strong>wp_zen_orbitposts</strong></div></th>
                            </tr>
                            <tr class="klyra-header-row">
                                <th class="klyra-checkbox-cell for_db_table_checkbox">
                                    <div class="cell_inner_wrapper_div for_db_table_checkbox"><input type="checkbox" id="klyra-select-all" class="klyra-checkbox"></div>
                                </th>
                                <th class="for_db_table_misc"><div class="cell_inner_wrapper_div for_db_table_misc">tool_buttons</div></th>
                                <!-- wp_posts columns -->
                                <th class="for_db_table_wp_posts" data-field="ID"><div class="cell_inner_wrapper_div for_db_table_wp_posts">id</div></th>
                                <th class="for_db_table_wp_posts" data-field="post_status"><div class="cell_inner_wrapper_div for_db_table_wp_posts">post_status</div></th>
                                <th class="for_db_table_wp_posts" data-field="combo_title_name"><div class="cell_inner_wrapper_div for_db_table_wp_posts">combo title name</div></th>
                                <th class="for_db_table_wp_posts klyra-sortable-column" data-field="post_title" style="cursor: pointer; user-select: none;"><div class="cell_inner_wrapper_div for_db_table_wp_posts">post_title <span class="klyra-sort-indicator"></span></div></th>
                                <th class="for_db_table_wp_posts" data-field="post_name"><div class="cell_inner_wrapper_div for_db_table_wp_posts">post_name</div></th>
                                <th class="for_db_table_wp_posts" data-field="post_content"><div class="cell_inner_wrapper_div for_db_table_wp_posts">post_content</div></th>
                                <th class="for_db_table_wp_posts" data-field="post_type"><div class="cell_inner_wrapper_div for_db_table_wp_posts">post_type</div></th>
                                <th class="for_db_table_wp_posts" data-field="post_date"><div class="cell_inner_wrapper_div for_db_table_wp_posts">post_date</div></th>
                                <th class="for_db_table_wp_posts" data-field="post_modified"><div class="cell_inner_wrapper_div for_db_table_wp_posts">post_modified</div></th>
                                <th class="for_db_table_wp_posts" data-field="post_author"><div class="cell_inner_wrapper_div for_db_table_wp_posts">post_author</div></th>
                                <th class="for_db_table_wp_posts" data-field="post_parent"><div class="cell_inner_wrapper_div for_db_table_wp_posts">post_parent</div></th>
                                <th class="for_db_table_wp_posts" data-field="menu_order"><div class="cell_inner_wrapper_div for_db_table_wp_posts">menu_order</div></th>
                                <th class="for_db_table_wp_posts" data-field="comment_status"><div class="cell_inner_wrapper_div for_db_table_wp_posts">comment_status</div></th>
                                <th class="for_db_table_wp_posts" data-field="ping_status"><div class="cell_inner_wrapper_div for_db_table_wp_posts">ping_status</div></th>
                                <!-- wp_postmeta column -->
                                <th class="for_db_table_wp_postmeta" data-field="_elementor_data"><div class="cell_inner_wrapper_div for_db_table_wp_postmeta">_elementor_data</div></th>
                                <!-- wp_zen_orbitposts columns -->
                                <th class="for_db_table_wp_zen_orbitposts" data-field="rel_wp_post_id"><div class="cell_inner_wrapper_div for_db_table_wp_zen_orbitposts">rel_wp_post_id</div></th>
                                <th class="for_db_table_wp_zen_orbitposts" data-field="orbitpost_id"><div class="cell_inner_wrapper_div for_db_table_wp_zen_orbitposts">orbitpost_id</div></th>
                                <th class="for_db_table_wp_zen_orbitposts" data-field="redshift_datum"><div class="cell_inner_wrapper_div for_db_table_wp_zen_orbitposts">redshift_datum</div></th>
                                <th class="for_db_table_wp_zen_orbitposts" data-field="rover_datum"><div class="cell_inner_wrapper_div for_db_table_wp_zen_orbitposts">rover_datum</div></th>
                                <th class="for_db_table_wp_zen_orbitposts" data-field="hudson_imgplanbatch_id"><div class="cell_inner_wrapper_div for_db_table_wp_zen_orbitposts">hudson_imgplanbatch_id</div></th>
                                <th class="for_db_table_wp_zen_orbitposts" data-field="is_pinned"><div class="cell_inner_wrapper_div for_db_table_wp_zen_orbitposts">is_pinned</div></th>
                                <th class="for_db_table_wp_zen_orbitposts" data-field="is_flagged"><div class="cell_inner_wrapper_div for_db_table_wp_zen_orbitposts">is_flagged</div></th>
                                <th class="for_db_table_wp_zen_orbitposts" data-field="is_starred"><div class="cell_inner_wrapper_div for_db_table_wp_zen_orbitposts">is_starred</div></th>
                                <th class="for_db_table_wp_zen_orbitposts" data-field="is_squared"><div class="cell_inner_wrapper_div for_db_table_wp_zen_orbitposts">is_squared</div></th>
                                <th class="for_db_table_wp_zen_orbitposts" data-field="created_at"><div class="cell_inner_wrapper_div for_db_table_wp_zen_orbitposts">created_at</div></th>
                                <th class="for_db_table_wp_zen_orbitposts" data-field="updated_at"><div class="cell_inner_wrapper_div for_db_table_wp_zen_orbitposts">updated_at</div></th>
                            </tr>
                        </thead>
                        <tbody id="klyra-beamray-tbody">
                            <tr>
                                <td colspan="31" class="klyra-loading for_db_table_misc"><div class="cell_inner_wrapper_div for_db_table_misc">Loading data...</div></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        
        <div id="klyra-create-modal" class="klyra-modal">
            <div class="klyra-modal-content">
                <div class="klyra-modal-header">
                    <h2 class="klyra-modal-title" id="klyra-modal-title">Create New Post/Page</h2>
                    <button class="klyra-modal-close" id="klyra-modal-close">&times;</button>
                </div>
                
                <form id="klyra-modal-form">
                    <input type="hidden" id="modal-post-id" name="post_id">
                    
                    <div class="klyra-form-grid">
                        <div class="klyra-form-field">
                            <label class="klyra-form-label">Post Type</label>
                            <select id="modal-post-type" name="post_type" class="klyra-form-select">
                                <option value="post">Post</option>
                                <option value="page">Page</option>
                            </select>
                        </div>
                        
                        <div class="klyra-form-field">
                            <label class="klyra-form-label">Status</label>
                            <select id="modal-post-status" name="post_status" class="klyra-form-select">
                                <option value="draft">Draft</option>
                                <option value="publish">Published</option>
                                <option value="private">Private</option>
                            </select>
                        </div>
                        
                        <div class="klyra-form-field full-width">
                            <label class="klyra-form-label">Title</label>
                            <input type="text" id="modal-post-title" name="post_title" class="klyra-form-input">
                        </div>
                        
                        <div class="klyra-form-field full-width">
                            <label class="klyra-form-label">Content</label>
                            <textarea id="modal-post-content" name="post_content" class="klyra-form-textarea"></textarea>
                        </div>
                        
                        <div class="klyra-form-field">
                            <label class="klyra-form-label">Slug</label>
                            <input type="text" id="modal-post-name" name="post_name" class="klyra-form-input">
                        </div>
                        
                        <div class="klyra-form-field">
                            <label class="klyra-form-label">Parent ID</label>
                            <input type="number" id="modal-post-parent" name="post_parent" class="klyra-form-input" value="0">
                        </div>
                    </div>
                    
                    <div class="klyra-modal-actions">
                        <button type="button" class="klyra-modal-btn secondary" id="klyra-modal-cancel">Cancel</button>
                        <button type="submit" class="klyra-modal-btn primary" id="klyra-modal-save">Save</button>
                    </div>
                </form>
            </div>
        </div>
        
        <div id="klyra-content-editor-modal" class="klyra-modal">
            <div class="klyra-content-editor-content">
                <div class="klyra-content-editor-header">Edit post_content</div>
                <textarea id="klyra-content-editor-textarea" class="klyra-content-editor-textarea"></textarea>
                <div class="klyra-content-editor-actions">
                    <button type="button" class="klyra-content-editor-btn cancel" id="klyra-content-editor-cancel">Cancel</button>
                    <button type="button" class="klyra-content-editor-btn save" id="klyra-content-editor-save">Save</button>
                </div>
            </div>
        </div>
    </div>
    <?php
}