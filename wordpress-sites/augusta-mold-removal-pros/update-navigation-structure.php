<?php
/**
 * Update navigation menu structure to move all service pages under Services parent
 * This script reorganizes the navigation to create a dropdown menu structure
 */

// Include WordPress
require_once dirname(__FILE__) . '/wp-config.php';

// Get the primary navigation menu
$menu_name = 'primary';
$locations = get_nav_menu_locations();

if (isset($locations[$menu_name])) {
    $menu_id = $locations[$menu_name];
    $menu_items = wp_get_nav_menu_items($menu_id);
    
    echo "Current menu items:\n";
    foreach ($menu_items as $item) {
        echo "- {$item->title} (ID: {$item->ID}, Parent: {$item->menu_item_parent})\n";
    }
    
    // Find the Services page menu item
    $services_menu_item = null;
    foreach ($menu_items as $item) {
        if (strtolower($item->title) === 'services') {
            $services_menu_item = $item;
            break;
        }
    }
    
    if (!$services_menu_item) {
        echo "Services menu item not found!\n";
        exit;
    }
    
    echo "\nServices menu item found: ID {$services_menu_item->ID}\n";
    
    // List of service page titles that should become child items
    $service_page_titles = [
        'Emergency Mold Service',
        'Water Damage Restoration', 
        'Attic & Crawlspace Service',
        'Commercial Mold Service',
        'HVAC Mold Service',
        'Mold Inspection Services'
    ];
    
    // Update menu items to make service pages children of Services
    $updates_made = 0;
    foreach ($menu_items as $item) {
        // Check if this is one of our service pages
        $is_service_page = false;
        foreach ($service_page_titles as $service_title) {
            if (strpos(strtolower($item->title), strtolower($service_title)) !== false) {
                $is_service_page = true;
                break;
            }
        }
        
        if ($is_service_page && $item->menu_item_parent != $services_menu_item->ID) {
            echo "Updating '{$item->title}' to be child of Services\n";
            
            // Update the menu item to be a child of Services
            $result = wp_update_nav_menu_item($menu_id, $item->ID, array(
                'menu-item-title' => $item->title,
                'menu-item-url' => $item->url,
                'menu-item-status' => 'publish',
                'menu-item-parent-id' => $services_menu_item->ID,
                'menu-item-position' => $item->menu_order,
                'menu-item-type' => $item->type,
                'menu-item-object' => $item->object,
                'menu-item-object-id' => $item->object_id
            ));
            
            if (!is_wp_error($result)) {
                $updates_made++;
                echo "✓ Successfully updated '{$item->title}'\n";
            } else {
                echo "✗ Failed to update '{$item->title}': " . $result->get_error_message() . "\n";
            }
        }
    }
    
    echo "\nNavigation menu update completed!\n";
    echo "Total updates made: {$updates_made}\n";
    
    // Display the updated menu structure
    echo "\nUpdated menu structure:\n";
    $updated_menu_items = wp_get_nav_menu_items($menu_id);
    
    foreach ($updated_menu_items as $item) {
        if ($item->menu_item_parent == 0) {
            echo "• {$item->title}\n";
            
            // Show child items
            foreach ($updated_menu_items as $child_item) {
                if ($child_item->menu_item_parent == $item->ID) {
                    echo "  └── {$child_item->title}\n";
                }
            }
        }
    }
    
} else {
    echo "Primary navigation menu not found!\n";
    echo "Available menu locations:\n";
    foreach ($locations as $location => $id) {
        echo "- {$location}: {$id}\n";
    }
}
?>