<?php

class Aardvark_Papluginsmar_Page {
    
    public function render() {
        $plugins_data = $this->get_plugins_data();
        ?>
        <div class="wrap">
            <h1>Plugins Management</h1>
            
            <!-- Search and Filter Section -->
            <div style="background: #f9f9f9; padding: 15px; margin: 20px 0; border: 1px solid #ddd; border-radius: 5px;">
                <div style="display: flex; gap: 15px; align-items: center; flex-wrap: wrap;">
                    <div style="flex: 1; min-width: 200px;">
                        <label for="search-input" style="font-weight: bold; margin-right: 8px;">Search:</label>
                        <input type="text" id="search-input" placeholder="Search plugins..." style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 3px;">
                    </div>
                    <div style="min-width: 150px;">
                        <label for="status-filter" style="font-weight: bold; margin-right: 8px;">Status:</label>
                        <select id="status-filter" style="padding: 8px; border: 1px solid #ddd; border-radius: 3px; width: 100%;">
                            <option value="">All Plugins</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="needs_update">Needs Update</option>
                        </select>
                    </div>
                    <div style="min-width: 120px;">
                        <button type="button" id="clear-filters" style="padding: 8px 15px; background: #666; color: white; border: none; border-radius: 3px; cursor: pointer;">Clear Filters</button>
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
            
            // Search functionality
            $('#search-input').on('keyup', function() {
                const searchText = $(this).val().toLowerCase();
                $('#plugins-table tbody tr').each(function() {
                    const $row = $(this);
                    const text = $row.text().toLowerCase();
                    $row.toggle(text.indexOf(searchText) > -1);
                });
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
            
            // Clear filters
            $('#clear-filters').on('click', function() {
                $('#search-input').val('');
                $('#status-filter').val('');
                $('#plugins-table tbody tr').show();
            });
            
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