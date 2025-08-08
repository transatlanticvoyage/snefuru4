<?php
/**
 * Navigation menu update - reorganize service pages under Services parent
 */

// Load WordPress without theme
define('WP_USE_THEMES', false);
require_once(__DIR__ . '/../../../../wp-load.php');

echo "<h1>Navigation Menu Update</h1>";

// Get all registered menus
$menu_locations = get_nav_menu_locations();
$menus = wp_get_nav_menus();

echo "<h2>Available Menus:</h2>";
foreach ($menus as $menu) {
    echo "<p>- {$menu->name} (ID: {$menu->term_id}, Slug: {$menu->slug})</p>";
}

// Find primary menu or first available menu
$primary_menu = null;
foreach ($menus as $menu) {
    if ($menu->slug === 'primary' || $menu->name === 'Primary' || $menu->name === 'Main Menu') {
        $primary_menu = $menu;
        break;
    }
}

if (!$primary_menu && !empty($menus)) {
    $primary_menu = $menus[0]; // Use first menu if no primary found
}

if (!$primary_menu) {
    echo "<p><strong>Error: No navigation menu found!</strong></p>";
    exit;
}

echo "<h2>Working with menu: {$primary_menu->name}</h2>";

// Get menu items
$menu_items = wp_get_nav_menu_items($primary_menu->term_id, array('order' => 'ASC'));

if (!$menu_items) {
    echo "<p><strong>Error: No menu items found!</strong></p>";
    exit;
}

echo "<h3>Current Menu Structure:</h3>";
echo "<ul>";
foreach ($menu_items as $item) {
    $parent_indicator = $item->menu_item_parent ? " (Parent: {$item->menu_item_parent})" : "";
    $indent = $item->menu_item_parent ? "└── " : "";
    echo "<li>{$indent}{$item->title} (ID: {$item->ID}){$parent_indicator}</li>";
}
echo "</ul>";

// Find the Services menu item
$services_item = null;
foreach ($menu_items as $item) {
    if (stripos($item->title, 'services') !== false && $item->menu_item_parent == 0) {
        $services_item = $item;
        break;
    }
}

if (!$services_item) {
    echo "<p><strong>Error: Services menu item not found!</strong></p>";
    exit;
}

echo "<p><strong>Services item found:</strong> {$services_item->title} (ID: {$services_item->ID})</p>";

// Define service page keywords
$service_keywords = array('emergency', 'water damage', 'attic', 'crawlspace', 'commercial', 'hvac', 'inspection');

// Process each menu item
$updates_made = 0;
echo "<h3>Processing Menu Items:</h3>";

foreach ($menu_items as $item) {
    // Skip if already under Services
    if ($item->menu_item_parent == $services_item->ID) {
        echo "<p>✓ '{$item->title}' is already under Services</p>";
        continue;
    }
    
    // Check if this is a service page
    $is_service_page = false;
    foreach ($service_keywords as $keyword) {
        if (stripos($item->title, $keyword) !== false) {
            $is_service_page = true;
            break;
        }
    }
    
    if ($is_service_page) {
        echo "<p>Moving '{$item->title}' under Services...</p>";
        
        // Prepare update data
        $menu_item_data = array(
            'menu-item-db-id' => $item->ID,
            'menu-item-title' => $item->title,
            'menu-item-url' => $item->url,
            'menu-item-description' => $item->description,
            'menu-item-parent-id' => $services_item->ID,
            'menu-item-type' => $item->type,
            'menu-item-object' => $item->object,
            'menu-item-object-id' => $item->object_id,
            'menu-item-status' => 'publish',
            'menu-item-position' => $item->menu_order
        );
        
        $result = wp_update_nav_menu_item($primary_menu->term_id, $item->ID, $menu_item_data);
        
        if (!is_wp_error($result)) {
            echo "<p style='color: green;'>✓ Successfully moved '{$item->title}'</p>";
            $updates_made++;
        } else {
            echo "<p style='color: red;'>✗ Failed to move '{$item->title}': " . $result->get_error_message() . "</p>";
        }
    }
}

echo "<h3>Update Summary:</h3>";
echo "<p><strong>Total items moved under Services: {$updates_made}</strong></p>";

// Show final menu structure
$updated_menu_items = wp_get_nav_menu_items($primary_menu->term_id, array('order' => 'ASC'));

echo "<h3>Final Menu Structure:</h3>";
echo "<ul>";

// Group items by parent
$parent_items = array();
$child_items = array();

foreach ($updated_menu_items as $item) {
    if ($item->menu_item_parent == 0) {
        $parent_items[] = $item;
    } else {
        $child_items[$item->menu_item_parent][] = $item;
    }
}

foreach ($parent_items as $parent) {
    echo "<li><strong>{$parent->title}</strong>";
    
    if (isset($child_items[$parent->ID])) {
        echo "<ul>";
        foreach ($child_items[$parent->ID] as $child) {
            echo "<li>└── {$child->title}</li>";
        }
        echo "</ul>";
    }
    echo "</li>";
}

echo "</ul>";

echo "<p style='color: green; font-weight: bold;'>Navigation menu update completed successfully!</p>";
?>