<?php

class Aardvark_Papluginsmar_Page {
    
    public function render() {
        $plugins_data = $this->get_plugins_data();
        ?>
        <div class="wrap">
            <h1>Plugins Management</h1>
            
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
                                                <!-- Row Pagination Controls -->
                                                <div style="display: flex; align-items: center; gap: 8px;">
                                                    <span style="font-weight: bold; font-size: 14px;">Rows/page:</span>
                                                    <select id="rows-per-page" style="padding: 4px 8px; border: 1px solid #ddd; border-radius: 3px; background: #4F46E5; color: white;">
                                                        <option value="10">10</option>
                                                        <option value="25" selected>25</option>
                                                        <option value="50">50</option>
                                                        <option value="100">100</option>
                                                        <option value="all">All</option>
                                                    </select>
                                                </div>
                                                <div style="display: flex; align-items: center; gap: 8px;">
                                                    <span style="font-weight: bold; font-size: 14px;">Row page:</span>
                                                    <button type="button" id="prev-page" style="padding: 4px 8px; background: #4F46E5; color: white; border: none; border-radius: 3px; cursor: pointer;">‹</button>
                                                    <span id="page-info" style="font-weight: bold;">1 of 1</span>
                                                    <button type="button" id="next-page" style="padding: 4px 8px; background: #4F46E5; color: white; border: none; border-radius: 3px; cursor: pointer;">›</button>
                                                </div>
                                            </div>
                                        </td>
                                        <td style="border: 1px solid black; padding: 4px;">
                                            <div style="display: flex; align-items: end;">
                                                <input type="text" id="plugin-search" placeholder="Search plugins..." style="width: 200px; margin-bottom: 3px; padding: 8px; border: 1px solid #ddd; border-radius: 3px; font-size: 14px;">
                                            </div>
                                        </td>
                                        <td style="border: 1px solid black; padding: 4px;">
                                            <button type="button" id="wolf-options" style="padding: 6px 12px; background: #2271b1; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 12px;">
                                                wolf options
                                            </button>
                                        </td>
                                        <td style="border: 1px solid black; padding: 4px;">
                                            <button type="button" id="column-templates" style="padding: 6px 12px; background: #2271b1; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 12px;">
                                                use the pillarshift coltemp system
                                            </button>
                                        </td>
                                        <td style="border: 1px solid black; padding: 4px;">
                                            <div style="display: flex; align-items: end; gap: 16px;">
                                                <!-- Column Pagination Controls -->
                                                <div style="display: flex; align-items: center; gap: 8px;">
                                                    <span style="font-weight: bold; font-size: 14px;">Cols/page:</span>
                                                    <select id="cols-per-page" style="padding: 4px 8px; border: 1px solid #ddd; border-radius: 3px; background: #EAB308; color: black;">
                                                        <option value="5">5</option>
                                                        <option value="7">7</option>
                                                        <option value="10">10</option>
                                                        <option value="11" selected>11</option>
                                                        <option value="all">All</option>
                                                    </select>
                                                </div>
                                                <div style="display: flex; align-items: center; gap: 8px;">
                                                    <span style="font-weight: bold; font-size: 14px;">Col page:</span>
                                                    <button type="button" id="prev-col-page" style="padding: 4px 8px; background: #EAB308; color: black; border: none; border-radius: 3px; cursor: pointer;">‹</button>
                                                    <span id="col-page-info" style="font-weight: bold;">1 of 1</span>
                                                    <button type="button" id="next-col-page" style="padding: 4px 8px; background: #EAB308; color: black; border: none; border-radius: 3px; cursor: pointer;">›</button>
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
                            <th style="border: 1px solid #555; padding: 12px; text-align: left;"><strong>plume4</strong></th>
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
                            <td style="border: 1px solid #555; padding: 8px;">-</td>
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
                $('#page-info').text(currentPage + ' of ' + totalPages);
                $('#prev-page').prop('disabled', currentPage <= 1);
                $('#next-page').prop('disabled', currentPage >= totalPages);
            }
            
            $('#rows-per-page').on('change', function() {
                rowsPerPage = $(this).val() === 'all' ? totalRows : parseInt($(this).val());
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
                $('#col-page-info').text(currentColPage + ' of ' + totalColPages);
                $('#prev-col-page').prop('disabled', currentColPage <= 1);
                $('#next-col-page').prop('disabled', currentColPage >= totalColPages);
            }
            
            $('#cols-per-page').on('change', function() {
                colsPerPage = $(this).val() === 'all' ? totalCols : parseInt($(this).val());
                currentColPage = 1;
                updateColPagination();
                // Implement column pagination logic here
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
            
            // Wolf options button (placeholder)
            $('#wolf-options').on('click', function() {
                alert('Wolf options popup will be implemented later');
            });
            
            // Column templates button (placeholder)
            $('#column-templates').on('click', function() {
                alert('Column templates popup will be implemented later');
            });
            
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
                'needs_update' => isset($plugin_updates->response[$plugin_path])
            );
        }
        
        return $plugins_data;
    }
}