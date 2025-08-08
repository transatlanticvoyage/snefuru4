<?php
/**
 * Simple navigation menu update script
 * Updates menu structure to organize service pages under Services
 */

// WordPress Bootstrap
define('WP_USE_THEMES', false);
require_once('./wp-load.php');

echo "=== Navigation Menu Update Script ===\n";

// Get all menus
$menus = wp_get_nav_menus();
echo "Available menus:\n";
foreach ($menus as $menu) {
    echo "- {$menu->name} (ID: {$menu->term_id})\n";
}

// Find the primary menu or first available menu
$menu_to_update = null;
foreach ($menus as $menu) {
    if (strtolower($menu->name) === 'primary' || strtolower($menu->name) === 'main menu' || strtolower($menu->slug) === 'primary') {
        $menu_to_update = $menu;
        break;
    }
}

// If no primary menu found, use the first one
if (!$menu_to_update && !empty($menus)) {
    $menu_to_update = $menus[0];
}

if (!$menu_to_update) {
    echo "No navigation menu found!\n";
    exit;
}

echo "\nWorking with menu: {$menu_to_update->name} (ID: {$menu_to_update->term_id})\n";

// Get menu items
$menu_items = wp_get_nav_menu_items($menu_to_update->term_id);

if (!$menu_items) {
    echo "No menu items found!\n";
    exit;
}

echo "\nCurrent menu structure:\n";
foreach ($menu_items as $item) {
    $indent = str_repeat('  ', $item->menu_item_parent ? 1 : 0);
    echo "{$indent}- {$item->title} (ID: {$item->ID}, Parent: {$item->menu_item_parent})\n";
}

// Find Services menu item
$services_item = null;
foreach ($menu_items as $item) {
    if (stripos($item->title, 'services') !== false && $item->menu_item_parent == 0) {
        $services_item = $item;
        break;
    }
}

if (!$services_item) {
    echo "\nServices menu item not found!\n";
    exit;
}

echo "\nFound Services item: {$services_item->title} (ID: {$services_item->ID})\n";

// Service page patterns to look for
$service_patterns = [
    'emergency',
    'water damage', 
    'attic',
    'crawlspace',
    'commercial',
    'hvac',
    'mold inspection',
    'inspection'
];

// Update service pages to be children of Services
$updated_count = 0;

foreach ($menu_items as $item) {
    // Skip if already a child of Services
    if ($item->menu_item_parent == $services_item->ID) {
        continue;
    }
    
    // Check if this item matches any service pattern
    $is_service_page = false;
    foreach ($service_patterns as $pattern) {
        if (stripos($item->title, $pattern) !== false) {
            $is_service_page = true;
            break;
        }
    }
    
    if ($is_service_page) {
        echo "Moving '{$item->title}' under Services...\n";
        
        // Update this menu item to be a child of Services
        $update_data = array(
            'menu-item-db-id' => $item->ID,
            'menu-item-title' => $item->title,
            'menu-item-url' => $item->url,
            'menu-item-description' => $item->description,
            'menu-item-parent-id' => $services_item->ID,
            'menu-item-type' => $item->type,
            'menu-item-object' => $item->object,
            'menu-item-object-id' => $item->object_id,
            'menu-item-status' => 'publish'
        );
        
        $result = wp_update_nav_menu_item($menu_to_update->term_id, $item->ID, $update_data);
        
        if (!is_wp_error($result)) {
            echo "✓ Successfully moved '{$item->title}'\n";
            $updated_count++;
        } else {
            echo "✗ Failed to move '{$item->title}': " . $result->get_error_message() . "\n";
        }
    }
}

echo "\n=== Update Complete ===\n";
echo "Items moved under Services: {$updated_count}\n";

// Show final menu structure
echo "\nFinal menu structure:\n";
$final_menu_items = wp_get_nav_menu_items($menu_to_update->term_id);

$top_level_items = array();
$child_items = array();

foreach ($final_menu_items as $item) {
    if ($item->menu_item_parent == 0) {
        $top_level_items[] = $item;
    } else {
        $child_items[$item->menu_item_parent][] = $item;
    }
}

foreach ($top_level_items as $item) {
    echo "• {$item->title}\n";
    
    if (isset($child_items[$item->ID])) {
        foreach ($child_items[$item->ID] as $child) {
            echo "  └── {$child->title}\n";
        }
    }
}

echo "\nNavigation menu update completed successfully!\n";
?>