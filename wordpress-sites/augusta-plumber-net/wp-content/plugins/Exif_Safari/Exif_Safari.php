<?php
/*
Plugin Name: Exif Safari
Description: A powerful plugin for editing all EXIF metadata fields of images already uploaded to the WordPress Media Library.
Version: 1.2
Author: Your Name
*/

// Add EXIF Metadata Editing to Media Library Image Edit Page
add_action('attachment_fields_to_edit', 'exif_safari_display_metadata_fields', 10, 2);

function exif_safari_display_metadata_fields($form_fields, $post) {
    $meta = wp_get_attachment_metadata($post->ID);
    $fields = [
        'aperture', 'credit', 'camera', 'caption', 'created_timestamp',
        'copyright', 'focal_length', 'iso', 'shutter_speed', 'title',
        'orientation', 'keywords', 'GPSLatitude', 'GPSLongitude', 'GPSAltitude', 'GPSTimestamp'
    ];
    
    foreach ($fields as $field) {
        $value = isset($meta['image_meta'][$field]) ? $meta['image_meta'][$field] : '';
        $form_fields['exif_safari_' . $field] = [
            'label' => '<strong>' . ucfirst(str_replace('_', ' ', $field)) . '</strong>',
            'input' => 'text',
            'value' => $value,
        ];
    }

    return $form_fields;
}

// Save Updated EXIF Metadata
add_filter('attachment_fields_to_save', 'exif_safari_save_metadata_fields', 10, 2);

function exif_safari_save_metadata_fields($post, $attachment) {
    $meta = wp_get_attachment_metadata($post);
    
    $fields = [
        'aperture', 'credit', 'camera', 'caption', 'created_timestamp',
        'copyright', 'focal_length', 'iso', 'shutter_speed', 'title',
        'orientation', 'keywords', 'GPSLatitude', 'GPSLongitude', 'GPSAltitude', 'GPSTimestamp'
    ];
    
    foreach ($fields as $field) {
        if (isset($attachment['exif_safari_' . $field])) {
            $meta['image_meta'][$field] = sanitize_text_field($attachment['exif_safari_' . $field]);
        }
    }

    wp_update_attachment_metadata($post, $meta);
    return $post;
}
?>