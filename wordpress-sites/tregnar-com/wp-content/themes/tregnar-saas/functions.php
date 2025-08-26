<?php
/**
 * Tregnar SaaS Theme Functions
 */

// Enqueue theme styles
function tregnar_saas_styles() {
    wp_enqueue_style('tregnar-saas-style', get_stylesheet_uri(), array(), '1.0.0');
    
    // Add Google Fonts
    wp_enqueue_style('google-fonts', 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap', array(), null);
}
add_action('wp_enqueue_scripts', 'tregnar_saas_styles');

// Theme setup
function tregnar_saas_setup() {
    // Add theme support for various features
    add_theme_support('title-tag');
    add_theme_support('post-thumbnails');
    add_theme_support('html5', array(
        'search-form',
        'comment-form',
        'comment-list',
        'gallery',
        'caption',
    ));
    add_theme_support('custom-logo');
    add_theme_support('customize-selective-refresh-widgets');
    
    // Add support for Elementor
    add_theme_support('elementor');
    
    // Register navigation menus
    register_nav_menus(array(
        'primary' => __('Primary Menu', 'tregnar-saas'),
        'footer' => __('Footer Menu', 'tregnar-saas'),
    ));
}
add_action('after_setup_theme', 'tregnar_saas_setup');

// Customize the title for Tregnar
function tregnar_custom_title($title) {
    if (is_home() || is_front_page()) {
        return 'Tregnar - Scale Your Website Portfolio';
    }
    return $title;
}
add_filter('wp_title', 'tregnar_custom_title');
add_filter('pre_get_document_title', 'tregnar_custom_title');

// Add custom meta description
function tregnar_meta_description() {
    if (is_home() || is_front_page()) {
        echo '<meta name="description" content="The complete SaaS platform for managing websites in bulk. Build, launch, and optimize lead generation sites, rank and rent properties, affiliate networks, and more.">' . "\n";
    }
}
add_action('wp_head', 'tregnar_meta_description');

// Add custom JavaScript for video functionality
function tregnar_saas_scripts() {
    wp_enqueue_script('tregnar-saas-main', get_template_directory_uri() . '/js/main.js', array(), '1.0.0', true);
}
add_action('wp_enqueue_scripts', 'tregnar_saas_scripts');

// Register widget areas
function tregnar_saas_widgets_init() {
    register_sidebar(array(
        'name'          => __('Sidebar', 'tregnar-saas'),
        'id'            => 'sidebar-1',
        'description'   => __('Add widgets here.', 'tregnar-saas'),
        'before_widget' => '<section id="%1$s" class="widget %2$s">',
        'after_widget'  => '</section>',
        'before_title'  => '<h2 class="widget-title">',
        'after_title'   => '</h2>',
    ));
    
    register_sidebar(array(
        'name'          => __('Footer Widgets', 'tregnar-saas'),
        'id'            => 'footer-widgets',
        'description'   => __('Add footer widgets here.', 'tregnar-saas'),
        'before_widget' => '<div id="%1$s" class="widget %2$s">',
        'after_widget'  => '</div>',
        'before_title'  => '<h3 class="widget-title">',
        'after_title'   => '</h3>',
    ));
}
add_action('widgets_init', 'tregnar_saas_widgets_init');

// Custom excerpt length
function tregnar_saas_excerpt_length($length) {
    return 30;
}
add_filter('excerpt_length', 'tregnar_saas_excerpt_length', 999);

// Custom excerpt more text
function tregnar_saas_excerpt_more($more) {
    return '...';
}
add_filter('excerpt_more', 'tregnar_saas_excerpt_more');

// Add custom body classes
function tregnar_saas_body_classes($classes) {
    if (is_home() || is_front_page()) {
        $classes[] = 'tregnar-homepage';
    }
    
    if (is_page_template('page-elementor.php')) {
        $classes[] = 'elementor-page';
    }
    
    return $classes;
}
add_filter('body_class', 'tregnar_saas_body_classes');

// Elementor compatibility
function tregnar_saas_elementor_support() {
    // Remove default WordPress styles on Elementor pages
    if (defined('ELEMENTOR_VERSION')) {
        add_action('wp_enqueue_scripts', function() {
            if (\Elementor\Plugin::$instance->preview->is_preview_mode()) {
                wp_dequeue_style('tregnar-saas-style');
            }
        }, 20);
    }
}
add_action('init', 'tregnar_saas_elementor_support');

// Customize WordPress admin area for Tregnar branding
function tregnar_admin_customization() {
    // Change footer text in admin
    add_filter('admin_footer_text', function() {
        return '<span id="footer-thankyou">Powered by <a href="https://wordpress.org">WordPress</a> | <strong>Tregnar SaaS Platform</strong></span>';
    });
    
    // Change login logo
    add_action('login_head', function() {
        echo '<style type="text/css">
            .login h1 a { 
                background-image: none !important; 
                background-size: contain !important; 
                width: auto !important; 
                height: auto !important; 
                text-indent: 0 !important; 
                font-size: 24px !important;
                color: #3B82F6 !important;
                font-weight: 700 !important;
            }
            .login h1 a:before { 
                content: "Tregnar"; 
            }
        </style>';
    });
}
add_action('admin_init', 'tregnar_admin_customization');

// Add theme customizer options
function tregnar_saas_customize_register($wp_customize) {
    // Hero Section
    $wp_customize->add_section('hero_section', array(
        'title'    => __('Hero Section', 'tregnar-saas'),
        'priority' => 30,
    ));
    
    // Hero Title
    $wp_customize->add_setting('hero_title', array(
        'default'           => 'Scale Your Website Portfolio with Tregnar',
        'sanitize_callback' => 'sanitize_text_field',
    ));
    
    $wp_customize->add_control('hero_title', array(
        'label'   => __('Hero Title', 'tregnar-saas'),
        'section' => 'hero_section',
        'type'    => 'text',
    ));
    
    // Hero Subtitle
    $wp_customize->add_setting('hero_subtitle', array(
        'default'           => 'The complete SaaS platform for managing websites in bulk.',
        'sanitize_callback' => 'sanitize_textarea_field',
    ));
    
    $wp_customize->add_control('hero_subtitle', array(
        'label'   => __('Hero Subtitle', 'tregnar-saas'),
        'section' => 'hero_section',
        'type'    => 'textarea',
    ));
    
    // Video URL
    $wp_customize->add_setting('hero_video_url', array(
        'default'           => '',
        'sanitize_callback' => 'esc_url_raw',
    ));
    
    $wp_customize->add_control('hero_video_url', array(
        'label'       => __('Hero Video URL', 'tregnar-saas'),
        'section'     => 'hero_section',
        'type'        => 'url',
        'description' => __('Enter YouTube or Vimeo URL for hero video', 'tregnar-saas'),
    ));
}
add_action('customize_register', 'tregnar_saas_customize_register');

// Security enhancements
function tregnar_saas_security() {
    // Remove WordPress version from head
    remove_action('wp_head', 'wp_generator');
    
    // Hide login errors
    add_filter('login_errors', function() {
        return 'Invalid login credentials.';
    });
    
    // Disable file editing in admin
    if (!defined('DISALLOW_FILE_EDIT')) {
        define('DISALLOW_FILE_EDIT', true);
    }
}
add_action('init', 'tregnar_saas_security');

// Performance optimizations
function tregnar_saas_performance() {
    // Remove unnecessary WordPress features
    remove_action('wp_head', 'rsd_link');
    remove_action('wp_head', 'wlwmanifest_link');
    remove_action('wp_head', 'wp_shortlink_wp_head');
    remove_action('wp_head', 'rest_output_link_wp_head');
    remove_action('wp_head', 'wp_oembed_add_discovery_links');
    remove_action('template_redirect', 'rest_output_link_header', 11);
    
    // Disable emojis
    remove_action('wp_head', 'print_emoji_detection_script', 7);
    remove_action('wp_print_styles', 'print_emoji_styles');
    remove_action('admin_print_scripts', 'print_emoji_detection_script');
    remove_action('admin_print_styles', 'print_emoji_styles');
}
add_action('init', 'tregnar_saas_performance');

// Custom post types for better organization (if needed)
function tregnar_custom_post_types() {
    // You can add custom post types here if needed for the SaaS features
    // Example: Features, Testimonials, Case Studies, etc.
}
add_action('init', 'tregnar_custom_post_types');
?>