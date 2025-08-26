<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
    <meta charset="<?php bloginfo('charset'); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="profile" href="https://gmpg.org/xfn/11">
    
    <!-- Tregnar Favicon and Icons -->
    <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='0.9em' font-size='90'>🚀</text></svg>">
    
    <!-- Preconnect to external resources -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    
    <?php wp_head(); ?>
</head>

<body <?php body_class(); ?>>
<?php wp_body_open(); ?>

<div id="page" class="site">
    <a class="skip-link screen-reader-text" href="#primary"><?php esc_html_e('Skip to content', 'tregnar-saas'); ?></a>

    <?php if (!is_page_template('page-elementor.php')) : ?>
    <header id="masthead" class="site-header">
        <div class="header-container">
            <div class="site-branding">
                <?php
                if (has_custom_logo()) {
                    the_custom_logo();
                } else {
                    ?>
                    <h1 class="site-title">
                        <a href="<?php echo esc_url(home_url('/')); ?>" rel="home">
                            <span class="logo-text">Tregnar</span>
                        </a>
                    </h1>
                    <?php
                }
                ?>
            </div>

            <nav id="site-navigation" class="main-navigation">
                <button class="menu-toggle" aria-controls="primary-menu" aria-expanded="false">
                    <span class="menu-icon"></span>
                    <span class="menu-text"><?php esc_html_e('Menu', 'tregnar-saas'); ?></span>
                </button>
                
                <?php
                wp_nav_menu(array(
                    'theme_location' => 'primary',
                    'menu_id'        => 'primary-menu',
                    'fallback_cb'    => false,
                ));
                ?>
                
                <div class="header-actions">
                    <a href="#" class="btn btn-outline">Log In</a>
                    <a href="#" class="btn btn-primary">Start Free Trial</a>
                </div>
            </nav>
        </div>
    </header>
    <?php endif; ?>

    <div id="content" class="site-content">

<style>
/* Header Styles */
.site-header {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 1000;
    padding: 16px 0;
    transition: all 0.3s ease;
}

.header-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.site-branding .site-title {
    margin: 0;
    font-size: 24px;
    font-weight: 800;
}

.site-branding .site-title a {
    text-decoration: none;
    color: #3B82F6;
    display: flex;
    align-items: center;
    gap: 8px;
}

.logo-text {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

.main-navigation {
    display: flex;
    align-items: center;
    gap: 32px;
}

.main-navigation ul {
    display: flex;
    list-style: none;
    margin: 0;
    padding: 0;
    gap: 32px;
}

.main-navigation a {
    text-decoration: none;
    color: #374151;
    font-weight: 500;
    font-size: 16px;
    transition: color 0.3s ease;
}

.main-navigation a:hover {
    color: #3B82F6;
}

.header-actions {
    display: flex;
    gap: 16px;
    align-items: center;
}

.btn {
    padding: 10px 20px;
    border-radius: 8px;
    font-weight: 600;
    font-size: 14px;
    text-decoration: none;
    transition: all 0.3s ease;
    border: 2px solid transparent;
    display: inline-block;
    text-align: center;
}

.btn-outline {
    color: #374151;
    border-color: #D1D5DB;
}

.btn-outline:hover {
    border-color: #3B82F6;
    color: #3B82F6;
}

.btn-primary {
    background: #3B82F6;
    color: white;
}

.btn-primary:hover {
    background: #1E40AF;
    transform: translateY(-2px);
}

.menu-toggle {
    display: none;
    background: none;
    border: none;
    cursor: pointer;
    padding: 8px;
    flex-direction: column;
    gap: 4px;
    align-items: center;
}

.menu-icon {
    display: block;
    width: 24px;
    height: 2px;
    background: #374151;
    position: relative;
    transition: all 0.3s ease;
}

.menu-icon::before,
.menu-icon::after {
    content: '';
    position: absolute;
    left: 0;
    width: 100%;
    height: 2px;
    background: #374151;
    transition: all 0.3s ease;
}

.menu-icon::before {
    top: -6px;
}

.menu-icon::after {
    bottom: -6px;
}

.menu-text {
    font-size: 12px;
    color: #6B7280;
    margin-top: 4px;
}

/* Mobile Navigation */
@media (max-width: 768px) {
    .menu-toggle {
        display: flex;
    }
    
    .main-navigation ul {
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background: white;
        flex-direction: column;
        padding: 20px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        display: none;
    }
    
    .main-navigation.nav-open ul {
        display: flex;
    }
    
    .header-actions {
        position: absolute;
        top: 100%;
        right: 24px;
        background: white;
        padding: 20px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        border-radius: 8px;
        margin-top: 8px;
        flex-direction: column;
        min-width: 120px;
        display: none;
    }
    
    .main-navigation.nav-open ~ .header-actions {
        display: flex;
    }
}

/* Add top padding to body to account for fixed header */
body:not(.elementor-page) {
    padding-top: 80px;
}

.elementor-page body {
    padding-top: 0;
}

/* Skip link */
.skip-link {
    position: absolute;
    left: -9999px;
    top: 6px;
    z-index: 999999;
    text-decoration: underline;
}

.skip-link:focus {
    display: block;
    left: 6px;
    top: 7px;
    z-index: 999999;
    padding: 8px 16px;
    text-decoration: none;
    background: #000;
    color: #fff;
}

.screen-reader-text {
    clip: rect(1px, 1px, 1px, 1px);
    position: absolute !important;
    height: 1px;
    width: 1px;
    overflow: hidden;
}

.screen-reader-text:focus {
    background-color: #f1f1f1;
    border-radius: 3px;
    box-shadow: 0 0 2px 2px rgba(0, 0, 0, 0.6);
    clip: auto !important;
    color: #21759b;
    display: block;
    font-size: 14px;
    font-weight: bold;
    height: auto;
    left: 5px;
    line-height: normal;
    padding: 15px 23px 14px;
    text-decoration: none;
    top: 5px;
    width: auto;
    z-index: 100000;
}
</style>

<script>
// Mobile menu toggle functionality
document.addEventListener('DOMContentLoaded', function() {
    const menuToggle = document.querySelector('.menu-toggle');
    const navigation = document.querySelector('.main-navigation');
    
    if (menuToggle && navigation) {
        menuToggle.addEventListener('click', function() {
            navigation.classList.toggle('nav-open');
        });
    }
});
</script>