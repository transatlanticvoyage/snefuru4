<?php
if (!defined('ABSPATH')) {
    exit;
}

// Handle configuration form submission
if (isset($_POST['save_site_config'])) {
    // Save site configuration as WordPress options instead of database table
    update_option('zurkovich_site_domain', sanitize_text_field($_POST['site_domain']));
    update_option('zurkovich_site_industry', sanitize_text_field($_POST['site_industry']));
    update_option('zurkovich_site_city', sanitize_text_field($_POST['site_city']));
    update_option('zurkovich_brand_name', sanitize_text_field($_POST['brand_name']));
    update_option('zurkovich_site_purpose', sanitize_textarea_field($_POST['site_purpose']));
    update_option('zurkovich_contact_email', sanitize_email($_POST['contact_email']));
    update_option('zurkovich_business_address', sanitize_text_field($_POST['business_address']));
    update_option('zurkovich_phone_number', sanitize_text_field($_POST['phone_number']));
    
    echo '<div class="notice notice-success is-dismissible"><p>Site configuration saved successfully!</p></div>';
}

// Get current values
$site_domain = get_option('zurkovich_site_domain', get_site_url());
$site_industry = get_option('zurkovich_site_industry', '');
$site_city = get_option('zurkovich_site_city', '');
$brand_name = get_option('zurkovich_brand_name', get_bloginfo('name'));
$site_purpose = get_option('zurkovich_site_purpose', '');
$contact_email = get_option('zurkovich_contact_email', get_option('admin_email'));
$business_address = get_option('zurkovich_business_address', '');
$phone_number = get_option('zurkovich_phone_number', '');
?>
<div class="wrap">
    <h1>Screen 2 - Site Configuration</h1>
    <p>Configure your site information for use with Zurkovich AI tools.</p>
    <hr>
    
    <form method="post" action="">
        <table class="form-table">
            <tr>
                <th scope="row"><label for="site_domain">Site Domain</label></th>
                <td><input type="url" name="site_domain" id="site_domain" class="regular-text" value="<?php echo esc_attr($site_domain); ?>" placeholder="https://example.com"></td>
            </tr>
            <tr>
                <th scope="row"><label for="site_industry">Industry</label></th>
                <td><input type="text" name="site_industry" id="site_industry" class="regular-text" value="<?php echo esc_attr($site_industry); ?>" placeholder="e.g., Plumbing, Real Estate, Consulting"></td>
            </tr>
            <tr>
                <th scope="row"><label for="site_city">City/Location</label></th>
                <td><input type="text" name="site_city" id="site_city" class="regular-text" value="<?php echo esc_attr($site_city); ?>" placeholder="e.g., New York, NY"></td>
            </tr>
            <tr>
                <th scope="row"><label for="brand_name">Brand Name</label></th>
                <td><input type="text" name="brand_name" id="brand_name" class="regular-text" value="<?php echo esc_attr($brand_name); ?>" placeholder="Your business name"></td>
            </tr>
            <tr>
                <th scope="row"><label for="site_purpose">Site Purpose/Description</label></th>
                <td><textarea name="site_purpose" id="site_purpose" class="large-text" rows="5" placeholder="Describe what your website is about and its main purpose"><?php echo esc_textarea($site_purpose); ?></textarea></td>
            </tr>
            <tr>
                <th scope="row"><label for="contact_email">Contact Email</label></th>
                <td><input type="email" name="contact_email" id="contact_email" class="regular-text" value="<?php echo esc_attr($contact_email); ?>" placeholder="info@example.com"></td>
            </tr>
            <tr>
                <th scope="row"><label for="business_address">Business Address</label></th>
                <td><input type="text" name="business_address" id="business_address" class="regular-text" value="<?php echo esc_attr($business_address); ?>" placeholder="123 Main St, City, State 12345"></td>
            </tr>
            <tr>
                <th scope="row"><label for="phone_number">Phone Number</label></th>
                <td><input type="tel" name="phone_number" id="phone_number" class="regular-text" value="<?php echo esc_attr($phone_number); ?>" placeholder="(555) 123-4567"></td>
            </tr>
        </table>
        
        <p class="submit">
            <input type="submit" name="save_site_config" class="button button-primary" value="Save Configuration">
        </p>
    </form>
    
    <div class="card" style="margin-top: 20px;">
        <h3>How to Use This Information</h3>
        <p>The information saved here can be used by other Zurkovich AI tools and screens. This configuration replaces the previous database-driven approach with a more flexible WordPress options system.</p>
        <ul>
            <li><strong>Site Domain:</strong> Used for API calls and content generation</li>
            <li><strong>Industry & Location:</strong> Helps AI tools generate relevant content</li>
            <li><strong>Brand Information:</strong> Used in content personalization</li>
            <li><strong>Contact Details:</strong> Available for content injection and templates</li>
        </ul>
    </div>
</div> 