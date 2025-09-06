# Tregnarexus Chamber Setup Guide

## 🚀 Quick Setup

### 1. Create Rate Limiting Table
Run the SQL from `sonar_api_rate_limiting_table.sql` in your Supabase SQL editor:

```sql
-- This creates the api_usage_tracking table for rate limiting
-- Copy and paste the contents of sonar_api_rate_limiting_table.sql
```

### 2. API Endpoint is Ready
The API endpoint has been created at:
```
/app/api/sonar/site-data-for-users-own-sites/route.ts
```

### 3. Chrome Extension is Updated
The extension now calls the correct API endpoint with proper error handling.

## 🎯 How It Works

### Authentication Flow (Content Script Approach)
1. **Extension injects script** into current tab (where you're logged in)
2. **Content script makes API call** from tab's context (has cookies!)
3. **API validates session** using `createRouteHandlerClient`
4. **Gets user internal ID** from `users` table via `auth_id`
5. **Verifies domain ownership** via `sitespren_unified_view`
6. **Returns data** with pseudo names for security
7. **Extension popup displays** the data

### Security Features
- ✅ **Domain ownership verification** - Users can only get data for sites they own
- ✅ **Pseudo database names** - Frontend never sees real table names
- ✅ **Session-based auth** - No API keys needed
- ✅ **Rate limiting** - 500 calls per user per day
- ✅ **CORS protection** - Only allows chrome-extension origins

### Data Sources
- **sitesprivate_base**: From `sitespren_unified_view.sitespren_base`
- **sitesglobal_ip_address**: From `sitesglub.glub_ip_address` (ONLY source)

## 🧪 Testing

### 1. Load Extension
1. Open Chrome: `chrome://extensions/`
2. Enable Developer mode
3. Load unpacked: Select the `/sonar` folder
4. Reload extension if already installed

### 2. Test API
1. Open a website you own (that exists in your sitespren table)
2. Click extension icon
3. Click "refresh metrics from my tregnar account"
4. Check browser console for detailed logs

### 3. Debug Issues
**"Not logged in"**: Make sure you're logged into your Tregnar app in any tab in the same browser
**"Site not found"**: Domain must exist in your sitespren table with exact match
**"Rate limit exceeded"**: You've hit 500 calls for the day
**"Cannot access this page"**: Try using the extension on a regular website (not chrome:// pages)
**"Failed to execute"**: Try refreshing the current tab and retry

## 📊 Database Schema

### New Table: `api_usage_tracking`
```sql
- id (UUID, PK)
- user_id (UUID, FK to users.id)  
- api_endpoint (VARCHAR)
- date (DATE)
- call_count (INTEGER)
- created_at/updated_at (TIMESTAMPTZ)
```

### Queries Used
```sql
-- Ownership check (same view as /sitejar4)
SELECT sitespren_base, fk_users_id 
FROM sitespren_unified_view 
WHERE sitespren_base = ? AND fk_users_id = ?

-- IP address lookup (only source)
SELECT glub_ip_address 
FROM sitesglub 
WHERE glub_sitesglub_base = ?
```

## 🔧 Configuration

### Environment Variables Required
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

### Chrome Extension Permissions
Already configured in `manifest.json`:
- `storage` - For secure caching
- `cookies` - For session sharing  
- `host_permissions` - For API access

## 🚨 Troubleshooting

### Common Issues

**1. "Connection failed"**
- Check if API endpoint exists at `/api/sonar/site-data-for-users-own-sites`
- Ensure you're logged into Tregnar app in ANY browser tab
- Try refreshing the current tab and retry extension
- Avoid using on chrome:// pages or extension pages

**2. "Site not found"**  
- Domain must exist in `sitespren` table
- Must be owned by current user (`fk_users_id` matches)
- www. is automatically stripped

**3. CORS Errors**
- Extension origin should be allowed
- Check browser console for specific CORS messages
- API includes permissive CORS for debugging

### Debug Logs
The API logs detailed information:
```javascript
// Check browser console and server logs for:
- API call details (domain, user, origin)
- Database query results
- Authentication status
- Rate limiting info
```

## 🎉 Success Indicators

When working correctly, you should see:
1. ✅ **Fields populated** with your site's data
2. ✅ **"Metrics refreshed successfully"** message
3. ✅ **Console logs** showing successful API calls
4. ✅ **Data persists** between popup opens (caching works)

The Tregnarexus Chamber is now ready to serve your site data securely! 🛡️