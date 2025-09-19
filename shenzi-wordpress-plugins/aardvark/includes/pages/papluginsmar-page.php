<?php

class Aardvark_Papluginsmar_Page {
    
    public function render() {
        $plugins_data = $this->get_plugins_data();
        ?>
        <div class="wrap">
            <div style="display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 20px;">
                <h1 style="display: flex; align-items: center; gap: 14px; margin: 0;">
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
                        <ellipse cx="7" y="20" rx="3" ry="1.5" fill="#8B4513" stroke="#654321" stroke-width="0.5" transform="rotate(-30 7 20)"/>
                    </svg>
                    Aardvark Plugins Manager - papluginsmar
                </h1>
                
                <!-- Shenzi Plugins Filter -->
                <div style="text-align: center;">
                    <div style="font-size: 16px; font-weight: bold; margin-bottom: 8px;">
                        shenzi plugins filter
                    </div>
                    <div style="display: inline-flex; border-radius: 6px; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);">
                        <button type="button" data-filter="all" class="shenzi-filter-btn" style="padding: 10px 8px; font-size: 14px; border: 1px solid #D1D5DB; border-radius: 6px 0 0 6px; margin-right: -1px; cursor: pointer; background: white; color: black;">all</button>
                        <button type="button" data-filter="shenzi" class="shenzi-filter-btn active" style="padding: 10px 8px; font-size: 14px; border: 1px solid #3B82F6; background: #3B82F6; color: white; margin-right: -1px; cursor: pointer;">shenzi only</button>
                        <button type="button" data-filter="non-shenzi" class="shenzi-filter-btn" style="padding: 10px 8px; font-size: 14px; border: 1px solid #D1D5DB; border-radius: 0 6px 6px 0; cursor: pointer; background: white; color: black;">non-shenzi only</button>
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
                                <?php if ($plugin['active']): ?>
                                    <button class="toggle-plugin" data-plugin="<?php echo esc_attr($plugin_path); ?>" data-action="deactivate" 
                                            style="padding: 4px 8px; background: #d63638; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 12px;">
                                        Deactivate
                                    </button>
                                <?php else: ?>
                                    <button class="toggle-plugin" data-plugin="<?php echo esc_attr($plugin_path); ?>" data-action="activate"
                                            style="padding: 4px 8px; background: #00a32a; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 12px;">
                                        Activate
                                    </button>
                                <?php endif; ?>
                                <?php if ($plugin['needs_update']): ?>
                                    <button class="update-plugin" data-plugin="<?php echo esc_attr($plugin_path); ?>"
                                            style="padding: 4px 8px; background: #2271b1; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 12px; margin-left: 5px;">
                                        Update
                                    </button>
                                <?php endif; ?>
                            </td>
                            <td style="border: 1px solid #555; border-left: 3px solid black; padding: 8px;">-</td>
                            <td style="border: 1px solid #555; padding: 8px;">-</td>
                            <td style="border: 1px solid #555; padding: 8px;">-</td>
                            <td style="border: 1px solid #555; padding: 8px;" data-is-shenzi="<?php echo $plugin['is_shenzi'] ? 'true' : 'false'; ?>">
                                <?php if ($plugin['is_shenzi']): ?>
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
            $('.toggle-plugin').on('click', function() {
                const $button = $(this);
                const plugin = $button.data('plugin');
                const action = $button.data('action');
                
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
            });
            
            // Update plugin
            $('.update-plugin').on('click', function() {
                const plugin = $(this).data('plugin');
                // Plugin update functionality would go here
                alert('Update functionality would be implemented here');
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
                $('#plugins-table tbody tr').each(function() {
                    const $row = $(this);
                    const isShenzi = $row.find('[data-is-shenzi]').data('is-shenzi') === 'true';
                    
                    let show = false;
                    if (filter === 'all') {
                        show = true;
                    } else if (filter === 'shenzi' && isShenzi) {
                        show = true;
                    } else if (filter === 'non-shenzi' && !isShenzi) {
                        show = true;
                    }
                    
                    $row.toggle(show);
                });
                
                updateDisplayCounts();
            }
            
            // Initialize with default filter (shenzi only)
            applyShenziFilter('shenzi');
            
            // Initialize pagination
            updateRowPagination();
            updateColPagination();
            updateDisplayCounts();
            updateColumnVisibility();
            
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
        });
        </script>
        <?php
    }
    
    /**
     * Get list of shenzi plugins
     */
    private function get_shenzi_plugins() {
        return array(
            'aardvark/aardvark.php',
            'ruplin/ruplin.php',
            'grove/grove.php',
            'beacon/beacon.php',
            'lumora/lumora.php'
        );
    }
    
    /**
     * Check if a plugin is a shenzi plugin
     */
    private function is_shenzi_plugin($plugin_path) {
        return in_array($plugin_path, $this->get_shenzi_plugins());
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
            $plugins_data[$plugin_path] = array(
                'Name' => $plugin_info['Name'],
                'Version' => $plugin_info['Version'],
                'Description' => $plugin_info['Description'],
                'PluginURI' => $plugin_info['PluginURI'] ?? '',
                'Author' => $plugin_info['Author'] ?? '',
                'active' => in_array($plugin_path, $active_plugins),
                'needs_update' => isset($plugin_updates->response[$plugin_path]),
                'is_shenzi' => $this->is_shenzi_plugin($plugin_path)
            );
        }
        
        return $plugins_data;
    }
}