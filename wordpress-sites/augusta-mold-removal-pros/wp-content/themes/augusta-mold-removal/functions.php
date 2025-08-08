<?php
/**
 * Augusta Mold Removal Pros Theme Functions
 *
 * @package Augusta_Mold_Removal
 */

// Enqueue parent and child theme styles
function augusta_mold_removal_enqueue_styles() {
    $parent_style = 'twentytwentyfive-style';
    
    wp_enqueue_style($parent_style, get_template_directory_uri() . '/style.css');
    wp_enqueue_style('augusta-mold-removal-style',
        get_stylesheet_directory_uri() . '/style.css',
        array($parent_style),
        wp_get_theme()->get('Version')
    );
}
add_action('wp_enqueue_scripts', 'augusta_mold_removal_enqueue_styles');

// Register custom block patterns
function augusta_mold_removal_register_patterns() {
    register_block_pattern_category(
        'augusta-mold-removal',
        array('label' => __('Augusta Mold Removal', 'augusta-mold-removal'))
    );
}
add_action('init', 'augusta_mold_removal_register_patterns');

// Add theme support for additional features
function augusta_mold_removal_theme_support() {
    // Add support for custom logo
    add_theme_support('custom-logo', array(
        'height'      => 80,
        'width'       => 250,
        'flex-height' => true,
        'flex-width'  => true,
    ));
    
    // Add support for wide alignment
    add_theme_support('align-wide');
    
    // Add custom image sizes for service pages
    add_image_size('service-thumbnail', 400, 300, true);
    add_image_size('hero-image', 1920, 600, true);
}
add_action('after_setup_theme', 'augusta_mold_removal_theme_support');

// Register custom menus
function augusta_mold_removal_register_menus() {
    register_nav_menus(array(
        'primary' => __('Primary Menu', 'augusta-mold-removal'),
        'footer' => __('Footer Menu', 'augusta-mold-removal'),
        'services' => __('Services Menu', 'augusta-mold-removal'),
    ));
}
add_action('init', 'augusta_mold_removal_register_menus');

// Custom function to create pages programmatically
function augusta_mold_removal_create_pages() {
    // Check if pages already exist
    $pages = array(
        'home' => array(
            'title' => 'Home',
            'content' => '', // We'll add content via block patterns
            'template' => '',
            'meta_input' => array(
                '_wp_page_template' => 'default'
            )
        ),
        'about' => array(
            'title' => 'About Us',
            'content' => '',
            'template' => '',
        ),
        'services' => array(
            'title' => 'Services',
            'content' => '',
            'template' => '',
        ),
        'contact' => array(
            'title' => 'Contact',
            'content' => '',
            'template' => '',
        ),
        'mold-inspection' => array(
            'title' => 'Mold Inspection Services',
            'content' => '',
            'template' => '',
            'parent' => 'services'
        ),
    );
    
    foreach ($pages as $slug => $page_data) {
        $page_check = get_page_by_path($slug);
        
        if (!isset($page_check->ID)) {
            $page_args = array(
                'post_title'    => $page_data['title'],
                'post_content'  => $page_data['content'],
                'post_status'   => 'publish',
                'post_type'     => 'page',
                'post_name'     => $slug,
            );
            
            if (isset($page_data['meta_input'])) {
                $page_args['meta_input'] = $page_data['meta_input'];
            }
            
            wp_insert_post($page_args);
        }
    }
    
    // Set front page
    $homepage = get_page_by_path('home');
    if ($homepage) {
        update_option('show_on_front', 'page');
        update_option('page_on_front', $homepage->ID);
    }
}
add_action('after_switch_theme', 'augusta_mold_removal_create_pages');

// Add custom Gutenberg block styles
function augusta_mold_removal_block_styles() {
    // Emergency CTA button style
    register_block_style(
        'core/button',
        array(
            'name'  => 'emergency-cta',
            'label' => __('Emergency CTA', 'augusta-mold-removal'),
        )
    );
    
    // Service card style for groups
    register_block_style(
        'core/group',
        array(
            'name'  => 'service-card',
            'label' => __('Service Card', 'augusta-mold-removal'),
        )
    );
    
    // Hero section style
    register_block_style(
        'core/cover',
        array(
            'name'  => 'hero-section',
            'label' => __('Hero Section', 'augusta-mold-removal'),
        )
    );
}
add_action('init', 'augusta_mold_removal_block_styles');

// Helper function to get phone number
function augusta_mold_removal_phone() {
    return '(762) 224-0533';
}

// Helper function to get email
function augusta_mold_removal_email() {
    return 'info@augustamoldremovalpros.com';
}

// Add Schema.org structured data for local business
function augusta_mold_removal_schema() {
    if (is_front_page()) {
        ?>
        <script type="application/ld+json">
        {
            "@context": "https://schema.org",
            "@type": "Service",
            "name": "Augusta Mold Removal Pros",
            "description": "Referral service connecting property owners with licensed mold removal professionals in Augusta, GA",
            "url": "<?php echo home_url(); ?>",
            "telephone": "(762) 224-0533",
            "serviceType": "Mold Professional Referral Service",
            "areaServed": {
                "@type": "Place",
                "name": "Augusta, GA and surrounding areas"
            },
            "provider": {
                "@type": "Organization",
                "name": "Augusta Mold Removal Pros"
            }
        }
        </script>
        <?php
    }
}
add_action('wp_head', 'augusta_mold_removal_schema');

// Function to organize navigation menu structure
function augusta_mold_removal_organize_navigation() {
    // Get primary menu
    $locations = get_nav_menu_locations();
    if (!isset($locations['primary'])) {
        return;
    }
    
    $menu_id = $locations['primary'];
    $menu_items = wp_get_nav_menu_items($menu_id);
    
    if (!$menu_items) {
        return;
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
        return;
    }
    
    // Service page keywords to organize under Services
    $service_keywords = array('emergency', 'water damage', 'attic', 'crawlspace', 'commercial', 'hvac', 'inspection');
    
    // Move service pages under Services parent
    foreach ($menu_items as $item) {
        // Skip if already under Services
        if ($item->menu_item_parent == $services_item->ID) {
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
            // Update menu item to be child of Services
            wp_update_nav_menu_item($menu_id, $item->ID, array(
                'menu-item-title' => $item->title,
                'menu-item-url' => $item->url,
                'menu-item-description' => $item->description,
                'menu-item-parent-id' => $services_item->ID,
                'menu-item-type' => $item->type,
                'menu-item-object' => $item->object,
                'menu-item-object-id' => $item->object_id,
                'menu-item-status' => 'publish'
            ));
        }
    }
}

// Hook to organize navigation after theme activation or menu updates
add_action('wp_update_nav_menu', 'augusta_mold_removal_organize_navigation');
add_action('after_switch_theme', 'augusta_mold_removal_organize_navigation', 20);