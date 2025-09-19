<?php

class Aardvark_Papluginsmar_Page {
    
    public function render() {
        $plugins_data = $this->get_combined_plugins_data();
        ?>
        <div class="wrap">
            
            <h1 style="display: flex; align-items: center; gap: 14px; margin: 0 0 20px 0;">
                <svg width="30" height="30" viewBox="0 0 30 30" fill="none" style="flex-shrink: 0;">
                    <!-- Aardvark body -->
                    <ellipse cx="15" cy="18" rx="8" ry="7" fill="#8B4513" stroke="#654321" stroke-width="1"/>
                    
                    <!-- Aardvark head -->
                    <ellipse cx="15" cy="10" rx="5" ry="4" fill="#8B4513" stroke="#654321" stroke-width="1"/>
                    
                    <!-- Long snout/nose -->
                    <ellipse cx="15" cy="6" rx="2" ry="3" fill="#A0522D" stroke="#654321" stroke-width="0.5"/>
                    
                    <!-- Ears -->
                    <ellipse cx="11" cy="8" rx="2" ry="3" fill="#8B4513" stroke="#654321" stroke-width="0.5" transform="rotate(-20 11 8)"/>
                    <ellipse cx="19" cy="8" rx="2" ry="3" fill="#8B4513" stroke="#654321" stroke-width="0.5" transform="rotate(20 19 8)"/>
                    
                    <!-- Eyes -->
                    <circle cx="12.5" cy="9" r="1" fill="#000"/>
                    <circle cx="17.5" cy="9" r="1" fill="#000"/>
                    <circle cx="12.8" cy="8.7" r="0.3" fill="#FFF"/>
                    <circle cx="17.8" cy="8.7" r="0.3" fill="#FFF"/>
                    
                    <!-- Nose tip -->
                    <circle cx="15" cy="4" r="0.8" fill="#000"/>
                    
                    <!-- Legs -->
                    <rect x="9" y="22" width="2" height="5" fill="#654321" rx="1"/>
                    <rect x="13" y="22" width="2" height="5" fill="#654321" rx="1"/>
                    <rect x="17" y="22" width="2" height="5" fill="#654321" rx="1"/>
                    <rect x="21" y="22" width="2" height="5" fill="#654321" rx="1"/>
                    
                    <!-- Tail -->
                    <ellipse cx="7" cy="20" rx="3" ry="1.5" fill="#8B4513" stroke="#654321" stroke-width="0.5" transform="rotate(-30 7 20)"/>
                </svg>
                Aardvark Plugins Manager - papluginsmar
            </h1>
            
            <!-- Shenzi Plugins Filter -->
            <div style="margin-bottom: 20px; display: flex; align-items: flex-start; gap: 30px;">
                <div>
                    <div style="font-size: 16px; font-weight: bold; margin-bottom: 8px;">
                        shenzi plugins filter
                    </div>
                    <div style="display: inline-flex; border-radius: 6px; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);">
                        <button type="button" data-filter="all" class="shenzi-filter-btn" style="padding: 10px 8px; font-size: 14px; border: 1px solid #D1D5DB; border-radius: 6px 0 0 6px; margin-right: -1px; cursor: pointer; background: white; color: black;">all</button>
                        <button type="button" data-filter="shenzi" class="shenzi-filter-btn active" style="padding: 10px 8px; font-size: 14px; border: 1px solid #3B82F6; background: #3B82F6; color: white; margin-right: -1px; cursor: pointer;">shenzi only</button>
                        <button type="button" data-filter="non-shenzi" class="shenzi-filter-btn" style="padding: 10px 8px; font-size: 14px; border: 1px solid #D1D5DB; border-radius: 0 6px 6px 0; cursor: pointer; background: white; color: black;">non-shenzi only</button>
                    </div>
                </div>
                
                <!-- WP Pusher Links and Database Info -->
                <div style="align-self: flex-end; display: flex; align-items: center; gap: 10px;">
                    <a href="/wp-admin/admin.php?page=wppusher-plugins" style="display: inline-block; padding: 10px 16px; font-size: 14px; background: #2271b1; color: white; text-decoration: none; border-radius: 6px; font-weight: 500; transition: background-color 0.15s ease;" onMouseOver="this.style.background='#1e5a8a'" onMouseOut="this.style.background='#2271b1'">
                        wppusher-plugins
                    </a>
                    <a href="/wp-admin/admin.php?page=wppusher-plugins-create" style="display: inline-block; padding: 10px 16px; font-size: 14px; background: #2271b1; color: white; text-decoration: none; border-radius: 6px; font-weight: 500; transition: background-color 0.15s ease;" onMouseOver="this.style.background='#1e5a8a'" onMouseOut="this.style.background='#2271b1'">
                        wppusher-plugins-create
                    </a>
                    <div style="display: flex; align-items: center; gap: 5px;">
                        <input type="text" id="db-name-display" value="<?php echo esc_attr(DB_NAME); ?>" readonly style="padding: 8px 12px; font-size: 14px; border: 1px solid #ddd; border-radius: 4px; background: #f9f9f9; color: #333; font-family: monospace;">
                        <button type="button" id="copy-db-name" style="padding: 8px 12px; font-size: 14px; background: #00a32a; color: white; border: none; border-radius: 4px; cursor: pointer;" title="Copy database name">📋</button>
                    </div>
                </div>
            </div>
            
            <!-- Rocket Chamber Div - Contains the pagination controls and search -->
            <div class="rocket_chamber_div" style="border: 1px solid black; padding: 0; margin: 20px 0; position: relative;">
                <div style="position: absolute; top: 4px; left: 4px; font-size: 16px; font-weight: bold; display: flex; align-items: center; gap: 6px;">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="black" style="transform: rotate(15deg);">
                        <!-- Rocket body -->
                        <ellipse cx="12" cy="8" rx="3" ry="6" fill="black"/>
                        <!-- Rocket nose cone -->
                        <path d="M12 2 L15 8 L9 8 Z" fill="black"/>
                        <!-- Left fin -->
                        <path d="M9 12 L7 14 L9 16 Z" fill="black"/>
                        <!-- Right fin -->
                        <path d="M15 12 L17 14 L15 16 Z" fill="black"/>
                        <!-- Exhaust flames -->
                        <path d="M10 14 L9 18 L10.5 16 L12 20 L13.5 16 L15 18 L14 14 Z" fill="black"/>
                        <!-- Window -->
                        <circle cx="12" cy="6" r="1" fill="white"/>
                    </svg>
                    rocket_chamber
                </div>
                <div style="margin-top: 24px; padding-top: 4px; padding-bottom: 0; padding-left: 8px; padding-right: 8px;">
                    <div style="display: flex; align-items: end; justify-content: space-between;">
                        <div style="display: flex; align-items: end; gap: 32px;">
                            <!-- Row pagination, search box, and column pagination table -->
                            <table style="border-collapse: collapse;">
                                <tbody>
                                    <tr>
                                        <td style="border: 1px solid black; padding: 4px; text-align: center;">
                                            <div style="font-size: 16px; display: flex; align-items: center; justify-content: center; gap: 8px;">
                                                <span style="font-weight: bold;">row pagination</span>
                                                <span style="font-size: 14px; font-weight: normal;">
                                                    Showing <span style="font-weight: bold;" id="plugins-showing"><?php echo count($plugins_data); ?></span> of <span style="font-weight: bold;" id="plugins-total"><?php echo count($plugins_data); ?></span> plugins
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
                                                    Showing <span style="font-weight: bold;" id="columns-showing">11</span> columns of <span style="font-weight: bold;">11</span> total columns
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="border: 1px solid black; padding: 4px;">
                                            <div style="display: flex; align-items: end; gap: 16px;">
                                                <!-- Row Pagination Bar 1: Items per page selector -->
                                                <div style="display: flex; align-items: center;">
                                                    <span style="font-size: 12px; color: #4B5563; margin-right: 8px;">Rows/page:</span>
                                                    <div style="display: inline-flex; border-radius: 6px; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);">
                                                        <button type="button" data-rows="10" class="rows-per-page-btn" style="padding: 10px 8px; font-size: 14px; border: 1px solid #D1D5DB; border-radius: 6px 0 0 6px; margin-right: -1px; cursor: pointer; background: white;">10</button>
                                                        <button type="button" data-rows="25" class="rows-per-page-btn active" style="padding: 10px 8px; font-size: 14px; border: 1px solid #3B82F6; background: #3B82F6; color: white; margin-right: -1px; cursor: pointer;">25</button>
                                                        <button type="button" data-rows="50" class="rows-per-page-btn" style="padding: 10px 8px; font-size: 14px; border: 1px solid #D1D5DB; margin-right: -1px; cursor: pointer; background: white;">50</button>
                                                        <button type="button" data-rows="100" class="rows-per-page-btn" style="padding: 10px 8px; font-size: 14px; border: 1px solid #D1D5DB; margin-right: -1px; cursor: pointer; background: white;">100</button>
                                                        <button type="button" data-rows="200" class="rows-per-page-btn" style="padding: 10px 8px; font-size: 14px; border: 1px solid #D1D5DB; margin-right: -1px; cursor: pointer; background: white;">200</button>
                                                        <button type="button" data-rows="all" class="rows-per-page-btn" style="padding: 10px 8px; font-size: 14px; border: 1px solid #D1D5DB; border-radius: 0 6px 6px 0; cursor: pointer; background: white;">All</button>
                                                    </div>
                                                </div>
                                                <!-- Row Pagination Bar 2: Page navigation -->
                                                <div style="display: flex; align-items: center;">
                                                    <span style="font-size: 12px; color: #4B5563; margin-right: 8px;">Row page:</span>
                                                    <nav style="display: inline-flex; border-radius: 6px; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);">
                                                        <button type="button" id="prev-page" style="position: relative; display: inline-flex; align-items: center; border-radius: 6px 0 0 6px; padding: 8px; font-size: 14px; padding-top: 10px; padding-bottom: 10px; color: #9CA3AF; border: 1px solid #D1D5DB; cursor: pointer; background: white;">
                                                            <svg style="width: 16px; height: 16px; color: #6B7280;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                                                                <path d="M1 4v6h6" />
                                                                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                                                            </svg>
                                                        </button>
                                                        <button type="button" id="page-info-btn" style="position: relative; display: inline-flex; align-items: center; padding: 8px 12px; font-size: 14px; padding-top: 10px; padding-bottom: 10px; border: 1px solid #D1D5DB; margin-left: -1px; cursor: pointer; background: white; font-weight: bold;">1</button>
                                                        <button type="button" id="next-page" style="position: relative; display: inline-flex; align-items: center; border-radius: 0 6px 6px 0; padding: 8px; font-size: 14px; padding-top: 10px; padding-bottom: 10px; color: #9CA3AF; border: 1px solid #D1D5DB; margin-left: -1px; cursor: pointer; background: white;">
                                                            <svg style="width: 16px; height: 16px; color: #6B7280;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                                                                <path d="M23 4v6h-6" />
                                                                <path d="M20.49 15a9 9 0 1 1-2.13-9.36L23 10" />
                                                            </svg>
                                                        </button>
                                                    </nav>
                                                </div>
                                            </div>
                                        </td>
                                        <td style="border: 1px solid black; padding: 4px;">
                                            <div style="display: flex; align-items: end;">
                                                <input type="text" id="plugin-search" placeholder="Search plugins..." style="width: 200px; margin-bottom: 3px; padding: 8px 12px; border: 1px solid #D1D5DB; border-radius: 4px; font-size: 14px; background: white; outline: none; transition: all 0.15s ease;" onFocus="this.style.outline='none'; this.style.borderColor='#3B82F6'; this.style.boxShadow='0 0 0 2px rgba(59, 130, 246, 0.1)'" onBlur="this.style.borderColor='#D1D5DB'; this.style.boxShadow='none'">
                                            </div>
                                        </td>
                                        <td style="border: 1px solid black; padding: 4px;">
                                            <button type="button" id="wolf-options" style="background: #2563EB; color: white; font-weight: 500; padding: 8px 16px; border-radius: 6px; font-size: 14px; transition: background-color 0.15s ease; border: none; cursor: pointer;" onMouseOver="this.style.background='#1D4ED8'" onMouseOut="this.style.background='#2563EB'">
                                                wolf options
                                            </button>
                                        </td>
                                        <td style="border: 1px solid black; padding: 4px;">
                                            <button type="button" id="column-templates" style="background: #7C3AED; color: white; font-weight: 500; padding: 8px 16px; border-radius: 6px; font-size: 14px; transition: background-color 0.15s ease; border: none; cursor: pointer;" onMouseOver="this.style.background='#6D28D9'" onMouseOut="this.style.background='#7C3AED'">
                                                use the pillarshift coltemp system
                                            </button>
                                        </td>
                                        <td style="border: 1px solid black; padding: 4px;">
                                            <div style="display: flex; align-items: end; gap: 16px;">
                                                <!-- Column Pagination Bar 1: Columns per page quantity selector -->
                                                <div style="display: flex; align-items: center;">
                                                    <span style="font-size: 12px; color: #4B5563; margin-right: 8px;">Cols/page:</span>
                                                    <button type="button" data-cols="6" class="cols-per-page-btn" style="padding: 10px 8px; font-size: 14px; padding-top: 10px; padding-bottom: 10px; border: 1px solid #000; border-radius: 4px 0 0 4px; margin-right: -1px; cursor: pointer; background: white;">6</button>
                                                    <button type="button" data-cols="8" class="cols-per-page-btn" style="padding: 10px 8px; font-size: 14px; padding-top: 10px; padding-bottom: 10px; border: 1px solid #000; margin-right: -1px; cursor: pointer; background: white;">8</button>
                                                    <button type="button" data-cols="11" class="cols-per-page-btn active" style="padding: 10px 8px; font-size: 14px; padding-top: 10px; padding-bottom: 10px; border: 1px solid #000; background: #f8f782; color: black; margin-right: -1px; cursor: pointer;">11</button>
                                                    <button type="button" data-cols="15" class="cols-per-page-btn" style="padding: 10px 8px; font-size: 14px; padding-top: 10px; padding-bottom: 10px; border: 1px solid #000; margin-right: -1px; cursor: pointer; background: white;">15</button>
                                                    <button type="button" data-cols="all" class="cols-per-page-btn" style="padding: 10px 8px; font-size: 14px; padding-top: 10px; padding-bottom: 10px; border: 1px solid #000; border-radius: 0 4px 4px 0; cursor: pointer; background: white;">All</button>
                                                </div>
                                                <!-- Column Pagination Bar 2: Current column page selector -->
                                                <div style="display: flex; align-items: center;">
                                                    <span style="font-size: 12px; color: #4B5563; margin-right: 8px;">Col page:</span>
                                                    <button type="button" id="first-col-page" style="padding: 8px; font-size: 14px; padding-top: 10px; padding-bottom: 10px; border: 1px solid #000; border-radius: 4px 0 0 4px; margin-right: -1px; cursor: pointer; background: white;">≪</button>
                                                    <button type="button" id="prev-col-page" style="padding: 8px; font-size: 14px; padding-top: 10px; padding-bottom: 10px; border: 1px solid #000; margin-right: -1px; cursor: pointer; background: white;">
                                                        <svg style="width: 16px; height: 16px; color: #6B7280;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                                                            <path d="M1 4v6h6" />
                                                            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                                                        </svg>
                                                    </button>
                                                    <button type="button" id="col-page-display" style="padding: 8px 12px; font-size: 14px; padding-top: 10px; padding-bottom: 10px; border: 1px solid #000; margin-right: -1px; cursor: pointer; background: white; font-weight: bold;">1</button>
                                                    <button type="button" id="next-col-page" style="padding: 8px; font-size: 14px; padding-top: 10px; padding-bottom: 10px; border: 1px solid #000; margin-right: -1px; cursor: pointer; background: white;">
                                                        <svg style="width: 16px; height: 16px; color: #6B7280;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                                                            <path d="M23 4v6h-6" />
                                                            <path d="M20.49 15a9 9 0 1 1-2.13-9.36L23 10" />
                                                        </svg>
                                                    </button>
                                                    <button type="button" id="last-col-page" style="padding: 8px; font-size: 14px; padding-top: 10px; padding-bottom: 10px; border: 1px solid #000; border-radius: 0 4px 4px 0; cursor: pointer; background: white;">≫</button>
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

            <!-- Bulk Actions Section -->
            <div style="background: #f0f0f1; padding: 15px; margin: 20px 0; border: 1px solid #c3c4c7; border-radius: 5px;">
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px;">
                    <div style="display: flex; align-items: center; gap: 15px;">
                        <select id="bulk-action" style="padding: 8px; border: 1px solid #ddd; border-radius: 3px;">
                            <option value="">Bulk Actions</option>
                            <option value="activate">Activate</option>
                            <option value="deactivate">Deactivate</option>
                            <option value="update">Update</option>
                        </select>
                        <button type="button" id="apply-bulk-action" style="padding: 8px 15px; background: #2271b1; color: white; border: none; border-radius: 3px; cursor: pointer;">🚀 Process Selected Items</button>
                    </div>
                    <div style="display: flex; align-items: center; gap: 15px; color: #646970;">
                        <span id="selection-count" style="font-weight: bold;">0 items selected</span>
                        <button type="button" id="select-all" style="padding: 6px 12px; background: #f6f7f7; border: 1px solid #ddd; border-radius: 3px; cursor: pointer; font-size: 12px;">Select All</button>
                        <button type="button" id="deselect-all" style="padding: 6px 12px; background: #f6f7f7; border: 1px solid #ddd; border-radius: 3px; cursor: pointer; font-size: 12px;">Deselect All</button>
                    </div>
                </div>
            </div>

            <!-- Plugins Table -->
            <div style="margin: 20px 0;">
                <table id="plugins-table" style="width: 100%; border-collapse: collapse; border: 1px solid #555;">
                    <thead>
                        <tr style="background: #f1f1f1;">
                            <th style="border: 1px solid #555; padding: 12px; text-align: left; width: 40px;">
                                <input type="checkbox" id="select-all-checkbox">
                            </th>
                            <th style="border: 1px solid #555; padding: 12px; text-align: center; width: 40px;">
                                <span style="color: darkred; font-size: 16px;">★</span>
                            </th>
                            <th style="border: 1px solid #555; padding: 12px; text-align: left;">Plugin Name</th>
                            <th style="border: 1px solid #555; padding: 12px; text-align: left;">Version</th>
                            <th style="border: 1px solid #555; padding: 12px; text-align: left;">Status</th>
                            <th style="border: 1px solid #555; padding: 12px; text-align: left;">Update Available</th>
                            <th style="border: 1px solid #555; padding: 12px; text-align: left;">Description</th>
                            <th style="border: 1px solid #555; padding: 12px; text-align: left;">Actions</th>
                            <th style="border: 1px solid #555; border-left: 3px solid black; padding: 12px; text-align: left;"><strong>plume1</strong></th>
                            <th style="border: 1px solid #555; padding: 12px; text-align: left;"><strong>plume2</strong></th>
                            <th style="border: 1px solid #555; padding: 12px; text-align: left;"><strong>plume3</strong></th>
                            <th style="border: 1px solid #555; padding: 12px; text-align: left;"><strong>is_shenzi</strong></th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($plugins_data as $plugin_path => $plugin): ?>
                        <tr data-plugin-path="<?php echo esc_attr($plugin_path); ?>">
                            <td style="border: 1px solid #555; padding: 8px; text-align: center;">
                                <input type="checkbox" class="plugin-checkbox" value="<?php echo esc_attr($plugin_path); ?>">
                            </td>
                            <td style="border: 1px solid #555; padding: 8px; text-align: center;">
                                <span style="color: gray; font-size: 16px; -webkit-text-stroke: 1px gray; -webkit-text-fill-color: transparent;">★</span>
                            </td>
                            <td style="border: 1px solid #555; padding: 8px;">
                                <strong><?php echo esc_html($plugin['Name']); ?></strong>
                                <?php if (!empty($plugin['PluginURI'])): ?>
                                <br><small><a href="<?php echo esc_url($plugin['PluginURI']); ?>" target="_blank">Visit plugin site</a></small>
                                <?php endif; ?>
                            </td>
                            <td style="border: 1px solid #555; padding: 8px;">
                                <span class="editable" data-field="version" data-plugin="<?php echo esc_attr($plugin_path); ?>">
                                    <?php echo esc_html($plugin['Version']); ?>
                                </span>
                            </td>
                            <td style="border: 1px solid #555; padding: 8px;">
                                <span class="status-badge <?php echo $plugin['active'] ? 'active' : 'inactive'; ?>">
                                    <?php echo $plugin['active'] ? 'Active' : 'Inactive'; ?>
                                </span>
                            </td>
                            <td style="border: 1px solid #555; padding: 8px;">
                                <?php echo $plugin['needs_update'] ? '<span style="color: #d63638;">Yes</span>' : '<span style="color: #00a32a;">No</span>'; ?>
                            </td>
                            <td style="border: 1px solid #555; padding: 8px;">
                                <span class="editable" data-field="description" data-plugin="<?php echo esc_attr($plugin_path); ?>">
                                    <?php echo esc_html($plugin['Description']); ?>
                                </span>
                            </td>
                            <td style="border: 1px solid #555; padding: 8px;">
                                <?php if ($plugin['install_status'] === 'available'): ?>
                                    <!-- Install Button for uninstalled shenzi plugins -->
                                    <div style="display: inline-flex; border-radius: 6px; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);">
                                        <button class="plugin-action-btn" data-plugin="<?php echo esc_attr($plugin_path); ?>" data-action="install" 
                                                style="padding: 10px 16px; font-size: 14px; border: 1px solid #D1D5DB; border-radius: 6px; cursor: pointer; background: #2271b1; color: white;">
                                            Install from GitHub
                                        </button>
                                    </div>
                                <?php else: ?>
                                    <!-- Standard buttons for installed plugins -->
                                    <div style="display: inline-flex; border-radius: 6px; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);">
                                        <!-- Activate Button -->
                                        <button class="plugin-action-btn" data-plugin="<?php echo esc_attr($plugin_path); ?>" data-action="activate" 
                                                style="padding: 10px 8px; font-size: 14px; border: 1px solid #D1D5DB; border-radius: 6px 0 0 6px; margin-right: -1px; cursor: pointer; <?php echo $plugin['active'] ? 'background: #f0f0f0; color: #888; cursor: not-allowed;' : 'background: #00a32a; color: white;'; ?>"
                                                <?php echo $plugin['active'] ? 'disabled' : ''; ?>>
                                            Activate
                                        </button>
                                        
                                        <!-- Deactivate Button -->
                                        <button class="plugin-action-btn" data-plugin="<?php echo esc_attr($plugin_path); ?>" data-action="deactivate"
                                                style="padding: 10px 8px; font-size: 14px; border: 1px solid #D1D5DB; margin-right: -1px; cursor: pointer; <?php echo !$plugin['active'] ? 'background: #f0f0f0; color: #888; cursor: not-allowed;' : 'background: #d63638; color: white;'; ?>"
                                                <?php echo !$plugin['active'] ? 'disabled' : ''; ?>>
                                            Deactivate
                                        </button>
                                        
                                        <!-- Delete Button -->
                                        <button class="plugin-action-btn" data-plugin="<?php echo esc_attr($plugin_path); ?>" data-action="delete"
                                                style="padding: 10px 8px; font-size: 14px; border: 1px solid #D1D5DB; border-radius: 0 6px 6px 0; cursor: pointer; background: #b32d2e; color: white;">
                                            Delete
                                        </button>
                                    </div>
                                <?php endif; ?>
                            </td>
                            <td style="border: 1px solid #555; border-left: 3px solid black; padding: 8px; position: relative;">
                                <?php if (!empty($plugin['github_url'])): ?>
                                    <a href="<?php echo esc_url($plugin['github_url']); ?>" target="_blank" style="color: #2271b1; text-decoration: none; font-size: 12px;">
                                        <?php echo esc_html(parse_url($plugin['github_url'], PHP_URL_PATH)); ?>
                                    </a>
                                    <button class="copy-plume1-btn" data-copy-value="<?php echo esc_attr(ltrim(parse_url($plugin['github_url'], PHP_URL_PATH), '/')); ?>" style="position: absolute; right: 0; top: 0; height: 100%; width: 12px; border: 1px solid gray; background: gray; cursor: pointer; font-size: 8px;" onmouseover="this.style.background='yellow'" onmouseout="this.style.background='gray'"></button>
                                <?php else: ?>
                                    -
                                <?php endif; ?>
                            </td>
                            <td style="border: 1px solid #555; padding: 8px; position: relative;">
                                <?php if (!empty($plugin['branch_name'])): ?>
                                    <span style="background: #f0f6fc; color: #0969da; padding: 2px 6px; border-radius: 3px; font-size: 12px; font-family: monospace;">
                                        <?php echo esc_html($plugin['branch_name']); ?>
                                    </span>
                                    <button class="copy-plume2-btn" data-copy-value="<?php echo esc_attr($plugin['branch_name']); ?>" style="position: absolute; right: 0; top: 0; height: 100%; width: 12px; border: 1px solid gray; background: gray; cursor: pointer; font-size: 8px;" onmouseover="this.style.background='yellow'" onmouseout="this.style.background='gray'"></button>
                                <?php else: ?>
                                    -
                                <?php endif; ?>
                            </td>
                            <td style="border: 1px solid #555; padding: 8px;">
                                <?php if (!empty($plugin['remote_version']) && $plugin['install_status'] === 'installed'): ?>
                                    <span style="font-size: 12px;">
                                        Remote: <strong><?php echo esc_html($plugin['remote_version']); ?></strong><br>
                                        Local: <strong><?php echo esc_html($plugin['Version']); ?></strong>
                                    </span>
                                <?php elseif (!empty($plugin['remote_version'])): ?>
                                    <span style="font-size: 12px; color: #666;">
                                        v<?php echo esc_html($plugin['remote_version']); ?>
                                    </span>
                                <?php else: ?>
                                    -
                                <?php endif; ?>
                            </td>
                            <td style="border: 1px solid #555; padding: 8px;" data-is-shenzi="<?php echo $plugin['is_shenzi'] ? 'true' : 'false'; ?>">
                                <?php if ($plugin['is_shenzi'] && $plugin['install_status'] === 'available'): ?>
                                    <span style="background: #2271b1; color: white; padding: 4px 8px; border-radius: 3px; font-size: 12px; font-weight: bold;">AVAILABLE</span>
                                <?php elseif ($plugin['is_shenzi']): ?>
                                    <span style="background: #00a32a; color: white; padding: 4px 8px; border-radius: 3px; font-size: 12px; font-weight: bold;">YES</span>
                                <?php else: ?>
                                    <span style="background: #646970; color: white; padding: 4px 8px; border-radius: 3px; font-size: 12px; font-weight: bold;">NO</span>
                                <?php endif; ?>
                            </td>
                        </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>

            <style>
                .status-badge {
                    padding: 4px 8px;
                    border-radius: 3px;
                    font-size: 12px;
                    font-weight: bold;
                }
                .status-badge.active {
                    background: #d1e7dd;
                    color: #0f5132;
                }
                .status-badge.inactive {
                    background: #f8d7da;
                    color: #842029;
                }
                .editable {
                    cursor: pointer;
                    padding: 2px 4px;
                    border-radius: 3px;
                }
                .editable:hover {
                    background: #f0f0f1;
                }
                .editable.editing {
                    background: #fff;
                    border: 1px solid #2271b1;
                }
            </style>
        </div>

        <script>
        jQuery(document).ready(function($) {
            // Selection functionality
            let selectedCount = 0;
            
            function updateSelectionCount() {
                selectedCount = $('.plugin-checkbox:checked').length;
                $('#selection-count').text(selectedCount + ' items selected');
            }
            
            $('#select-all-checkbox').on('change', function() {
                $('.plugin-checkbox').prop('checked', this.checked);
                updateSelectionCount();
            });
            
            $('.plugin-checkbox').on('change', function() {
                updateSelectionCount();
                $('#select-all-checkbox').prop('checked', $('.plugin-checkbox:checked').length === $('.plugin-checkbox').length);
            });
            
            $('#select-all').on('click', function() {
                $('.plugin-checkbox').prop('checked', true);
                $('#select-all-checkbox').prop('checked', true);
                updateSelectionCount();
            });
            
            $('#deselect-all').on('click', function() {
                $('.plugin-checkbox').prop('checked', false);
                $('#select-all-checkbox').prop('checked', false);
                updateSelectionCount();
            });
            
            // Bulk actions
            $('#apply-bulk-action').on('click', function() {
                const action = $('#bulk-action').val();
                const selected = $('.plugin-checkbox:checked').map(function() {
                    return this.value;
                }).get();
                
                if (!action) {
                    alert('Please select a bulk action');
                    return;
                }
                
                if (selected.length === 0) {
                    alert('Please select at least one plugin');
                    return;
                }
                
                if (confirm('Are you sure you want to ' + action + ' ' + selected.length + ' plugin(s)?')) {
                    // Process bulk action via AJAX
                    processBulkAction(action, selected);
                }
            });
            
            // Individual plugin actions
            $('.plugin-action-btn').on('click', function() {
                const $button = $(this);
                const plugin = $button.data('plugin');
                const action = $button.data('action');
                
                // Don't process if button is disabled
                if ($button.prop('disabled')) {
                    return;
                }
                
                // Confirm delete action
                if (action === 'delete') {
                    if (!confirm('Are you sure you want to delete this plugin? This action cannot be undone.')) {
                        return;
                    }
                }
                
                if (action === 'activate' || action === 'deactivate') {
                    $.post(ajaxurl, {
                        action: 'aardvark_toggle_plugin',
                        plugin: plugin,
                        toggle_action: action,
                        nonce: '<?php echo wp_create_nonce('aardvark_plugin_action'); ?>'
                    }).done(function(response) {
                        if (response.success) {
                            location.reload();
                        } else {
                            alert('Error: ' + response.data);
                        }
                    });
                } else if (action === 'delete') {
                    $.post(ajaxurl, {
                        action: 'aardvark_delete_plugin',
                        plugin: plugin,
                        nonce: '<?php echo wp_create_nonce('aardvark_plugin_delete'); ?>'
                    }).done(function(response) {
                        if (response.success) {
                            location.reload();
                        } else {
                            alert('Error: ' + response.data);
                        }
                    });
                } else if (action === 'install') {
                    if (!confirm('Install this plugin from GitHub?')) {
                        return;
                    }
                    
                    $button.prop('disabled', true).text('Installing...');
                    
                    $.post(ajaxurl, {
                        action: 'aardvark_install_plugin',
                        plugin: plugin,
                        nonce: '<?php echo wp_create_nonce('aardvark_plugin_install'); ?>'
                    }).done(function(response) {
                        if (response.success) {
                            alert('Plugin installed successfully!');
                            location.reload();
                        } else {
                            alert('Error: ' + response.data);
                            $button.prop('disabled', false).text('Install from GitHub');
                        }
                    }).fail(function() {
                        alert('Installation failed. Please try again.');
                        $button.prop('disabled', false).text('Install from GitHub');
                    });
                }
            });
            
            // Inline editing
            $('.editable').on('click', function() {
                const $span = $(this);
                if ($span.hasClass('editing')) return;
                
                const originalText = $span.text();
                const field = $span.data('field');
                const plugin = $span.data('plugin');
                
                $span.addClass('editing');
                const $input = $('<input type="text" style="width: 100%; border: none; background: transparent;">');
                $input.val(originalText);
                $span.html($input);
                $input.focus().select();
                
                function saveEdit() {
                    const newValue = $input.val();
                    $span.removeClass('editing').text(newValue);
                    
                    // Save via AJAX
                    $.post(ajaxurl, {
                        action: 'aardvark_update_plugin_field',
                        plugin: plugin,
                        field: field,
                        value: newValue,
                        nonce: '<?php echo wp_create_nonce('aardvark_plugin_edit'); ?>'
                    });
                }
                
                function cancelEdit() {
                    $span.removeClass('editing').text(originalText);
                }
                
                $input.on('blur', saveEdit);
                $input.on('keypress', function(e) {
                    if (e.which === 13) saveEdit();
                    if (e.which === 27) cancelEdit();
                });
            });
            
            // Search functionality (rocket chamber search)
            $('#plugin-search').on('keyup', function() {
                const searchText = $(this).val().toLowerCase();
                $('#plugins-table tbody tr').each(function() {
                    const $row = $(this);
                    const text = $row.text().toLowerCase();
                    $row.toggle(text.indexOf(searchText) > -1);
                });
                updateDisplayCounts();
            });
            
            // Status filter
            $('#status-filter').on('change', function() {
                const filter = $(this).val();
                $('#plugins-table tbody tr').each(function() {
                    const $row = $(this);
                    if (!filter) {
                        $row.show();
                    } else {
                        const status = $row.find('.status-badge');
                        if (filter === 'active' && status.hasClass('active')) {
                            $row.show();
                        } else if (filter === 'inactive' && status.hasClass('inactive')) {
                            $row.show();
                        } else if (filter === 'needs_update' && $row.find('td:nth-child(5)').text().includes('Yes')) {
                            $row.show();
                        } else {
                            $row.hide();
                        }
                    }
                });
            });
            
            // Row pagination functionality
            let currentPage = 1;
            let rowsPerPage = 25;
            let totalRows = <?php echo count($plugins_data); ?>;
            
            function updateDisplayCounts() {
                const visibleRows = $('#plugins-table tbody tr:visible').length;
                $('#plugins-showing').text(visibleRows);
                $('#plugins-total').text(totalRows);
            }
            
            function updateRowPagination() {
                const totalPages = Math.ceil(totalRows / rowsPerPage);
                $('#page-info-btn').text(currentPage);
                $('#prev-page').prop('disabled', currentPage <= 1);
                $('#next-page').prop('disabled', currentPage >= totalPages);
            }
            
            // Row pagination button handlers
            $('.rows-per-page-btn').on('click', function() {
                $('.rows-per-page-btn').removeClass('active').css({
                    'background': 'white',
                    'color': 'black',
                    'border': '1px solid #D1D5DB'
                });
                $(this).addClass('active').css({
                    'background': '#3B82F6',
                    'color': 'white',
                    'border': '1px solid #3B82F6'
                });
                
                const rowsValue = $(this).data('rows');
                rowsPerPage = rowsValue === 'all' ? totalRows : parseInt(rowsValue);
                currentPage = 1;
                updateRowPagination();
                // Implement actual pagination logic here
            });
            
            $('#prev-page').on('click', function() {
                if (currentPage > 1) {
                    currentPage--;
                    updateRowPagination();
                    // Implement actual pagination logic here
                }
            });
            
            $('#next-page').on('click', function() {
                const totalPages = Math.ceil(totalRows / rowsPerPage);
                if (currentPage < totalPages) {
                    currentPage++;
                    updateRowPagination();
                    // Implement actual pagination logic here
                }
            });
            
            // Column pagination functionality
            let currentColPage = 1;
            let colsPerPage = 11;
            let totalCols = 11;
            
            function updateColPagination() {
                const totalColPages = Math.ceil(totalCols / colsPerPage);
                $('#col-page-display').text(currentColPage);
                $('#first-col-page').prop('disabled', currentColPage <= 1);
                $('#prev-col-page').prop('disabled', currentColPage <= 1);
                $('#next-col-page').prop('disabled', currentColPage >= totalColPages);
                $('#last-col-page').prop('disabled', currentColPage >= totalColPages);
            }
            
            // Column pagination button handlers
            $('.cols-per-page-btn').on('click', function() {
                $('.cols-per-page-btn').removeClass('active').css({
                    'background': 'white',
                    'color': 'black',
                    'border': '1px solid #000'
                });
                $(this).addClass('active').css({
                    'background': '#f8f782',
                    'color': 'black',
                    'border': '1px solid #000'
                });
                
                const colsValue = $(this).data('cols');
                colsPerPage = colsValue === 'all' ? totalCols : parseInt(colsValue);
                currentColPage = 1;
                updateColPagination();
                updateColumnVisibility();
            });
            
            $('#first-col-page').on('click', function() {
                currentColPage = 1;
                updateColPagination();
                updateColumnVisibility();
            });
            
            function updateColumnVisibility() {
                // Simple column pagination logic - hide/show columns based on current page
                const startCol = (currentColPage - 1) * colsPerPage;
                const endCol = startCol + colsPerPage;
                
                $('#plugins-table th, #plugins-table td').each(function(index) {
                    const colIndex = $(this).index();
                    if (colsPerPage === totalCols) {
                        $(this).show(); // Show all columns
                    } else {
                        if (colIndex >= startCol && colIndex < endCol) {
                            $(this).show();
                        } else {
                            $(this).hide();
                        }
                    }
                });
                
                // Update display text
                const visibleCols = Math.min(colsPerPage, totalCols - startCol);
                $('#columns-showing').text(visibleCols);
            }
            
            $('#prev-col-page').on('click', function() {
                if (currentColPage > 1) {
                    currentColPage--;
                    updateColPagination();
                    updateColumnVisibility();
                }
            });
            
            $('#next-col-page').on('click', function() {
                const totalColPages = Math.ceil(totalCols / colsPerPage);
                if (currentColPage < totalColPages) {
                    currentColPage++;
                    updateColPagination();
                    updateColumnVisibility();
                }
            });
            
            $('#last-col-page').on('click', function() {
                const totalColPages = Math.ceil(totalCols / colsPerPage);
                currentColPage = totalColPages;
                updateColPagination();
                updateColumnVisibility();
            });
            
            // Wolf options button (placeholder)
            $('#wolf-options').on('click', function() {
                alert('Wolf options popup will be implemented later');
            });
            
            // Column templates button (placeholder)
            $('#column-templates').on('click', function() {
                alert('Column templates popup will be implemented later');
            });
            
            // Shenzi filter functionality
            $('.shenzi-filter-btn').on('click', function() {
                $('.shenzi-filter-btn').removeClass('active').css({
                    'background': 'white',
                    'color': 'black',
                    'border': '1px solid #D1D5DB'
                });
                $(this).addClass('active').css({
                    'background': '#3B82F6',
                    'color': 'white',
                    'border': '1px solid #3B82F6'
                });
                
                const filterValue = $(this).data('filter');
                applyShenziFilter(filterValue);
            });
            
            function applyShenziFilter(filter) {
                let totalRows = 0;
                let shenziCount = 0;
                let shownCount = 0;
                
                $('#plugins-table tbody tr').each(function() {
                    const $row = $(this);
                    const $shenziCell = $row.find('[data-is-shenzi]');
                    const dataValue = $shenziCell.attr('data-is-shenzi');
                    const isShenzi = dataValue === 'true';
                    
                    totalRows++;
                    if (isShenzi) shenziCount++;
                    
                    let show = false;
                    if (filter === 'all') {
                        show = true;
                    } else if (filter === 'shenzi' && isShenzi) {
                        show = true;
                    } else if (filter === 'non-shenzi' && !isShenzi) {
                        show = true;
                    }
                    
                    if (show) shownCount++;
                    
                    $row.toggle(show);
                });
                
                updateDisplayCounts();
            }
            
            // Initialize pagination
            updateRowPagination();
            updateColPagination();
            updateDisplayCounts();
            updateColumnVisibility();
            
            // Initialize with default filter (shenzi only) - after a small delay to ensure DOM is ready
            setTimeout(function() {
                applyShenziFilter('shenzi');
            }, 100);
            
            function processBulkAction(action, plugins) {
                $.post(ajaxurl, {
                    action: 'aardvark_bulk_plugin_action',
                    bulk_action: action,
                    plugins: plugins,
                    nonce: '<?php echo wp_create_nonce('aardvark_bulk_action'); ?>'
                }).done(function(response) {
                    if (response.success) {
                        location.reload();
                    } else {
                        alert('Error: ' + response.data);
                    }
                });
            }
            
            // Database name copy functionality
            $('#copy-db-name').on('click', function() {
                const dbNameInput = document.getElementById('db-name-display');
                dbNameInput.select();
                dbNameInput.setSelectionRange(0, 99999); // For mobile devices
                
                try {
                    document.execCommand('copy');
                    $(this).text('✓').css('background', '#00a32a');
                    setTimeout(() => {
                        $(this).text('📋').css('background', '#00a32a');
                    }, 1000);
                } catch (err) {
                    console.log('Copy failed');
                }
            });
            
            // Plume1 copy functionality
            $(document).on('click', '.copy-plume1-btn', function() {
                const copyValue = $(this).data('copy-value');
                
                try {
                    navigator.clipboard.writeText(copyValue).then(() => {
                        $(this).css('background', 'green');
                        setTimeout(() => {
                            $(this).css('background', 'gray');
                        }, 1000);
                    });
                } catch (err) {
                    // Fallback for older browsers
                    const tempInput = document.createElement('input');
                    tempInput.value = copyValue;
                    document.body.appendChild(tempInput);
                    tempInput.select();
                    document.execCommand('copy');
                    document.body.removeChild(tempInput);
                    
                    $(this).css('background', 'green');
                    setTimeout(() => {
                        $(this).css('background', 'gray');
                    }, 1000);
                }
            });
            
            // Plume2 copy functionality
            $(document).on('click', '.copy-plume2-btn', function() {
                const copyValue = $(this).data('copy-value');
                
                try {
                    navigator.clipboard.writeText(copyValue).then(() => {
                        $(this).css('background', 'green');
                        setTimeout(() => {
                            $(this).css('background', 'gray');
                        }, 1000);
                    });
                } catch (err) {
                    // Fallback for older browsers
                    const tempInput = document.createElement('input');
                    tempInput.value = copyValue;
                    document.body.appendChild(tempInput);
                    tempInput.select();
                    document.execCommand('copy');
                    document.body.removeChild(tempInput);
                    
                    $(this).css('background', 'green');
                    setTimeout(() => {
                        $(this).css('background', 'gray');
                    }, 1000);
                }
            });
        });
        </script>
        <?php
    }
    
    /**
     * Get shenzi plugin definitions from database
     */
    private function get_shenzi_plugin_definitions() {
        global $wpdb;
        
        $table_name = $wpdb->prefix . 'zen_plugins_oasis';
        
        $results = $wpdb->get_results(
            "SELECT * FROM $table_name ORDER BY plugin_slug",
            ARRAY_A
        );
        
        return $results ?: array();
    }
    
    /**
     * Get combined plugins data (installed + shenzi definitions)
     */
    private function get_combined_plugins_data() {
        // 1. Get installed plugins (current source)
        $installed_plugins = $this->get_plugins_data();
        
        // 2. Get shenzi plugin definitions from database
        $shenzi_definitions = $this->get_shenzi_plugin_definitions();
        
        // 3. Merge with no duplicates (installed takes precedence)
        $combined = array();
        
        // Add all installed plugins first
        foreach ($installed_plugins as $path => $plugin) {
            $combined[$path] = array_merge($plugin, array(
                'source' => 'installed',
                'install_status' => 'installed',
                'github_url' => '',
                'branch_name' => '',
                'remote_version' => '',
                'notes' => ''
            ));
        }
        
        // Add uninstalled shenzi plugins and merge metadata for installed ones
        foreach ($shenzi_definitions as $definition) {
            $plugin_path = $definition['plugin_path'];
            
            if (!isset($combined[$plugin_path])) {
                // Plugin not installed - add as available
                $combined[$plugin_path] = array(
                    'Name' => ucfirst($definition['plugin_slug']),
                    'Version' => $definition['remote_version'] ?: 'Unknown',
                    'Description' => 'Shenzi plugin available for installation from GitHub',
                    'PluginURI' => $definition['github_url'],
                    'Author' => 'Shenzi Team',
                    'active' => false,
                    'needs_update' => false,
                    'is_shenzi' => true,
                    'source' => 'shenzi_definition',
                    'install_status' => 'available',
                    'github_url' => $definition['github_url'],
                    'branch_name' => $definition['branch_name'],
                    'remote_version' => $definition['remote_version'],
                    'notes' => $definition['notes']
                );
            } else {
                // Plugin is installed - merge shenzi metadata
                $combined[$plugin_path] = array_merge(
                    $combined[$plugin_path], 
                    array(
                        'is_shenzi' => true,
                        'github_url' => $definition['github_url'],
                        'branch_name' => $definition['branch_name'],
                        'remote_version' => $definition['remote_version'],
                        'notes' => $definition['notes']
                    )
                );
            }
        }
        
        return $combined;
    }
    
    /**
     * Get list of shenzi plugins (using actual paths from debug)
     */
    private function get_shenzi_plugins() {
        return array(
            'aardvark/aardvark.php',
            'ruplin/ruplin.php',
            'grove-wp-plugin/grove.php',
            'beacon/beacon.php',
            'lumora/lumora.php',
            'veyra/veyra.php',
            'harbor/harbor.php',
            'klyra/klyra.php'
        );
    }
    
    /**
     * Check if a plugin is a shenzi plugin
     */
    private function is_shenzi_plugin($plugin_path) {
        $shenzi_plugins = $this->get_shenzi_plugins();
        
        // Direct match using actual paths
        return in_array($plugin_path, $shenzi_plugins);
    }
    
    private function get_plugins_data() {
        if (!function_exists('get_plugins')) {
            require_once ABSPATH . 'wp-admin/includes/plugin.php';
        }
        
        $all_plugins = get_plugins();
        $active_plugins = get_option('active_plugins', array());
        $plugin_updates = get_site_transient('update_plugins');
        
        $plugins_data = array();
        
        foreach ($all_plugins as $plugin_path => $plugin_info) {
            $is_shenzi = $this->is_shenzi_plugin($plugin_path);
            
            $plugins_data[$plugin_path] = array(
                'Name' => $plugin_info['Name'],
                'Version' => $plugin_info['Version'],
                'Description' => $plugin_info['Description'],
                'PluginURI' => $plugin_info['PluginURI'] ?? '',
                'Author' => $plugin_info['Author'] ?? '',
                'active' => in_array($plugin_path, $active_plugins),
                'needs_update' => isset($plugin_updates->response[$plugin_path]),
                'is_shenzi' => $is_shenzi,
            );
        }
        
        return $plugins_data;
    }
}