# Snefuruplin WordPress Plugin Upload Setup Guide

## Overview

Your WordPress plugin now has the capability to receive image uploads directly from your Next.js app, eliminating the need for WordPress user credentials and providing a more secure upload method.

## Setup Steps

### 1. Install/Update the WordPress Plugin

1. **Upload the plugin** to your WordPress site:
   - Zip the entire `snefuruplin` folder
   - Upload via WordPress admin → Plugins → Add New → Upload Plugin
   - Or upload via FTP to `/wp-content/plugins/`

2. **Activate the plugin** in WordPress admin → Plugins

3. **Verify installation** by checking for "Snefuru" in the admin sidebar

### 2. Configure Plugin Upload Settings

1. **Go to WordPress admin → Snefuru → Upload Settings**

2. **Generate an API Key:**
   - Click "Generate API Key" button
   - Copy the generated key (you'll need it for step 3)
   - Keep this key secure!

3. **Configure upload settings:**
   - ✅ Enable "Allow image uploads via the plugin API"
   - Set maximum file size (recommend 10MB or higher)
   - Save settings

4. **Test the endpoint:**
   - Click "Test Upload Endpoint" button
   - Should show "✅ Upload endpoint is working correctly"

### 3. Update Next.js Environment Variables

Add the WordPress plugin API key to your Next.js environment:

```bash
# Add to .env.local or your production environment
WORDPRESS_UPLOAD_API_KEY=your_generated_api_key_here
```

### 4. Update Database Domain Configuration

For each WordPress domain that should use plugin uploads, update your database:

```sql
UPDATE domains1 
SET 
  wp_plugin_installed1 = true,
  wp_plugin_connected2 = true 
WHERE domain_base = 'your-wordpress-site.com';
```

### 5. Test the Upload Method

1. **Go to your rangivid page** with a batch that has images
2. **Associate the batch** with a WordPress domain that has the plugin installed
3. **Select "wp_plugin" as the push method**
4. **Click upload** and check Vercel logs for success

## Plugin API Endpoints

Once configured, your WordPress site will have these new endpoints:

### Upload Endpoint
```
POST https://your-wordpress-site.com/wp-json/snefuru/v1/upload-image
```

**Parameters:**
- `file` (file) - The image file to upload
- `api_key` (string) - Your plugin API key
- `filename` (string, optional) - Custom filename
- `batch_id` (string, optional) - Batch ID from your app
- `plan_id` (string, optional) - Plan ID from your app

**Response:**
```json
{
  "success": true,
  "message": "Image uploaded successfully",
  "data": {
    "attachment_id": 123,
    "url": "https://site.com/wp-content/uploads/2024/06/image.jpg",
    "filename": "image.jpg",
    "file_size": 125000,
    "batch_id": "batch-123",
    "plan_id": "plan-456",
    "upload_date": "2024-06-03 15:30:00"
  }
}
```

### Status Endpoint
```
GET https://your-wordpress-site.com/wp-json/snefuru/v1/status?api_key=YOUR_KEY
```

**Response:**
```json
{
  "success": true,
  "data": {
    "plugin_active": true,
    "plugin_version": "1.0.0",
    "wordpress_version": "6.4.1",
    "site_url": "https://your-site.com",
    "upload_max_filesize": "10 MB"
  }
}
```

## How It Works

1. **Your Next.js app** calls sfunc_63_push_images with `push_method='wp_plugin'`
2. **The function downloads** the image from your Supabase storage
3. **Makes a POST request** to your WordPress plugin's upload endpoint
4. **WordPress plugin**:
   - Validates the API key
   - Processes the file upload using WordPress's built-in media handling
   - Stores the image in WordPress media library
   - Returns the WordPress attachment ID and URL
5. **Your app receives** the WordPress media details and updates your database

## Benefits vs REST API Method

| Feature | Plugin Method | REST API Method |
|---------|---------------|-----------------|
| **Security** | ✅ API key (no user credentials) | ❌ Requires admin username/password |
| **Permissions** | ✅ Always works (plugin handles) | ❌ Can fail due to user roles |
| **WordPress Integration** | ✅ Full media library integration | ✅ Basic integration |
| **Metadata Storage** | ✅ Can store custom fields | ❌ Limited metadata |
| **Error Handling** | ✅ Detailed error logging | ❌ Limited error info |
| **Security Plugins** | ✅ Less likely to be blocked | ❌ Often blocked by security plugins |

## Monitoring & Troubleshooting

### View Upload Logs
- **WordPress admin → Snefuru → Upload Settings**
- **Recent Upload Activity** section shows last 10 uploads
- **WordPress admin → Snefuru → Logs** for detailed logs

### Common Issues

**1. "API key not configured"**
- Generate an API key in WordPress plugin settings
- Add key to your Next.js environment variables

**2. "Plugin endpoints not found (404)"**
- Make sure plugin is activated
- Check WordPress permalink settings (should be "Post name" or custom)
- Test: visit `your-site.com/wp-json/` to verify REST API works

**3. "Upload failed" errors**
- Check file size limits in WordPress admin → Upload Settings
- Verify file type is allowed (jpg, png, gif, webp)
- Check WordPress error logs

**4. "Connection timeout"**
- Large files may timeout - reduce file size or increase PHP limits
- Check your WordPress hosting's upload limits

### Testing Commands

**Test plugin status:**
```bash
curl "https://your-wordpress-site.com/wp-json/snefuru/v1/status?api_key=YOUR_API_KEY"
```

**Test image upload:**
```bash
curl -X POST \
  -F "file=@test-image.jpg" \
  -F "api_key=YOUR_API_KEY" \
  -F "filename=test-upload.jpg" \
  https://your-wordpress-site.com/wp-json/snefuru/v1/upload-image
```

## Migration from REST API Method

To switch existing domains from REST API to plugin method:

1. **Install and configure** the plugin (steps 1-3 above)
2. **Update domain records:**
   ```sql
   UPDATE domains1 
   SET 
     wp_plugin_installed1 = true,
     wp_plugin_connected2 = true 
   WHERE wpuser1 IS NOT NULL;  -- For domains that had REST API setup
   ```
3. **Test uploads** using `push_method='wp_plugin'`
4. **Optional:** Clear stored credentials after successful testing:
   ```sql
   UPDATE domains1 
   SET wpuser1 = NULL, wppass1 = NULL 
   WHERE wp_plugin_connected2 = true;
   ```

## Security Best Practices

1. **Keep API keys secure** - never commit to version control
2. **Regenerate keys** periodically or if compromised  
3. **Monitor upload logs** for suspicious activity
4. **Set appropriate file size limits** to prevent abuse
5. **Consider IP whitelisting** if uploading from fixed server IPs

You now have a robust, secure image upload system that doesn't require WordPress user credentials! 