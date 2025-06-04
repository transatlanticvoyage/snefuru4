# WordPress Permissions Debug Guide

## Step 1: Identify the Problematic WordPress Site

Run the SQL queries in `debug_wordpress_permissions.sql` to identify which WordPress site is having issues.

The Vercel logs show the error comes from `/api/bin45/sfunc_63_push_images`, so we need to find:
1. Which batch was being processed
2. Which domain/WordPress site it was trying to upload to
3. What WordPress username/password is being used

## Step 2: Check WordPress User Permissions

Once you identify the problematic WordPress site from Step 1:

### 2a. Manual Login Test
1. Go to `https://[your-wordpress-site]/wp-admin`
2. Log in with the `wpuser1` and `wppass1` from your database
3. Try uploading an image manually:
   - Go to Media → Add New
   - Try uploading any image file
   - If this fails, you've found the permission issue

### 2b. Check User Role
In WordPress admin, go to:
1. **Users → All Users**
2. **Find your API user** (the one stored in `wpuser1`)
3. **Check their role:**
   - ❌ **Subscriber** - Cannot upload files
   - ❌ **Contributor** - Cannot upload files  
   - ✅ **Author** - Can upload files
   - ✅ **Editor** - Can upload files
   - ✅ **Administrator** - Can upload files

### 2c. Fix User Permissions
**Option A: Change User Role (Recommended)**
1. In WordPress admin → Users → All Users
2. Click on your API user
3. Change their role to **Editor** or **Administrator**
4. Save changes

**Option B: Add Upload Capability**
If you need a custom solution, add this to your WordPress theme's `functions.php`:
```php
// Add upload capability to a specific user
function add_upload_capability_to_user() {
    $user = get_user_by('login', 'your-api-username');
    if ($user) {
        $user->add_cap('upload_files');
    }
}
add_action('init', 'add_upload_capability_to_user');
```

## Step 3: Test WordPress REST API Directly

Test the exact API endpoint that's failing:

### 3a. Using curl
```bash
# Replace with your actual WordPress site and credentials
curl -X POST \
  -u "your-wp-username:your-wp-password" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@test-image.jpg" \
  -F "title=Test Upload" \
  https://your-wordpress-site.com/wp-json/wp/v2/media
```

### 3b. Expected Responses
**✅ Success (200 response):**
```json
{
  "id": 123,
  "source_url": "https://site.com/wp-content/uploads/2024/06/test-image.jpg",
  "title": {"rendered": "Test Upload"}
}
```

**❌ Permission Error (403 response):**
```json
{
  "code": "rest_cannot_create",
  "message": "Sorry, you are not allowed to create posts as this user."
}
```

**❌ Auth Error (401 response):**
```json
{
  "code": "rest_forbidden",
  "message": "Application passwords are not available."
}
```

## Step 4: Check WordPress Configuration

### 4a. REST API Enabled?
Add this to a test PHP file in your WordPress site:
```php
<?php
// Check if REST API is enabled
if (function_exists('rest_url')) {
    echo "REST API URL: " . rest_url('wp/v2/media');
} else {
    echo "REST API is not available";
}

// Check current user capabilities
if (current_user_can('upload_files')) {
    echo "\nCurrent user CAN upload files";
} else {
    echo "\nCurrent user CANNOT upload files";
}
?>
```

### 4b. Check Security Plugins
Common security plugins that might block REST API:
- **Wordfence** - Check "Tools" → "Live Traffic" for blocked requests
- **Sucuri** - Check if REST API endpoints are blocked
- **iThemes Security** - Check "REST API" settings
- **All In One WP Security** - Check "REST API Security" settings

### 4c. Check File Upload Settings
In WordPress admin, go to **Settings → Media**:
- Check if file uploads are enabled
- Check maximum file size limits
- Verify allowed file types include images (jpg, png, etc.)

## Step 5: Alternative Solutions

### 5a. Use a Different WordPress User
1. Create a new WordPress admin user specifically for API uploads
2. Update your database with the new credentials:
```sql
UPDATE domains1 
SET wpuser1 = 'new-api-user', wppass1 = 'new-password' 
WHERE domain_base = 'your-problematic-site.com';
```

### 5b. Switch to WordPress Plugin Method
Instead of using REST API with username/password, implement the WordPress plugin upload method:
1. Install your Snefuruplin plugin on the WordPress site
2. Set up the plugin connection
3. Use `push_method = 'wp_plugin'` instead of `wp_login`

### 5c. Use Application Passwords (WordPress 5.6+)
1. In WordPress admin → Users → Profile
2. Scroll to "Application Passwords"
3. Create a new application password
4. Use this instead of the regular password in your `wppass1` field

## Step 6: Test the Fix

After implementing any fix:

1. **Test via your app:**
   - Go to rangivid page with a batch that has images
   - Associate it with the fixed WordPress domain
   - Try uploading images using sfunc_63

2. **Check Vercel logs:**
   - Should see successful uploads instead of permission errors
   - Look for status 200 responses instead of errors

3. **Verify in WordPress:**
   - Check Media Library for uploaded images
   - Confirm images are accessible via their URLs

## Common Solutions Summary

**Most likely fixes (in order of probability):**
1. 🎯 **Change WordPress user role to Editor/Administrator**
2. 🔧 **Check if security plugin is blocking REST API**
3. 🔑 **Use application passwords instead of regular password**
4. 👤 **Create a dedicated API user with proper permissions**
5. 🔌 **Switch to WordPress plugin upload method** 