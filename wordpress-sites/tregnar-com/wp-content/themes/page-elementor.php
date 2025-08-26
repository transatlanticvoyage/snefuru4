<?php
/*
Template Name: Elementor Full Width
*/

get_header(); ?>

<div class="elementor-page-content">
    <?php
    while (have_posts()) :
        the_post();
        the_content();
    endwhile;
    ?>
</div>

<?php get_footer(); ?>

<style>
/* Minimal styles for Elementor pages */
.elementor-page-content {
    width: 100%;
    overflow-x: hidden;
}

/* Remove default margins and padding for full Elementor control */
.elementor-page .site-main,
.elementor-page .content-area {
    margin: 0;
    padding: 0;
    width: 100%;
}

/* Hide default WordPress elements on Elementor pages */
.elementor-page .site-header,
.elementor-page .site-footer {
    display: none;
}

/* Override theme container constraints */
.elementor-page .container,
.elementor-page .site-content {
    max-width: none;
    width: 100%;
    padding: 0;
    margin: 0;
}
</style>