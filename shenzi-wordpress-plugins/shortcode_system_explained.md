# Shenzi WordPress Plugins - Shortcode System Analysis

## Executive Summary

The Shenzi plugin ecosystem employs a sophisticated **hierarchical fallback shortcode system** that ensures consistent functionality regardless of which plugins are active. No shortcodes are created during plugin activation - all registration occurs dynamically during the WordPress `init` hook.

## System Architecture

### Hierarchical Priority System
1. **Ruplin (snefuruplin)** - Primary system (Priority 1)
2. **Grove** - Enhanced fallback (Priority 2)
3. **Beacon** - Standard fallback (Priority 3)
4. **Lumora** - Minimal fallback (Priority 4)

### Registration Pattern
```php
// All plugins check hierarchy before registering
if (!is_plugin_active('snefuruplin/snefuruplin.php') && 
    !is_plugin_active('grove/grove.php')) {
    // Register shortcodes as fallback
}
```

## Shortcode Categories

### 1. Core Business Data Shortcodes

#### Service Management
- **`[zen_service]`** - Display individual service data
- **`[zen_services]`** - List multiple services
- **`[zen_service_image]`** - Service images
- **`[zen_pinned_services]`** - Only pinned services

#### Location Management  
- **`[zen_location]`** - Display individual location data
- **`[zen_locations]`** - List multiple locations
- **`[zen_location_image]`** - Location images
- **`[zen_pinned_locations]`** - Only pinned locations

#### Site Configuration
- **`[sitespren]`** - Access site configuration data

### 2. Phone System Shortcodes (Grove/Ruplin Only)

#### Basic Phone Formatting
- **`[buffalo_phone_number]`** - Buffalo-styled phone display
- **`[phone_local]`** - Local number formatting
- **`[phone_international]`** - International formatting
- **`[phone_link]`** - Clickable phone links

#### Advanced Phone Integration
- **`[sitespren_phone_link]`** - Auto-phone links from site data
- **`[beginning_a_code_moose]`** - Phone link opening helper

### 3. Dynamic Database-Driven Systems

#### Hoof Codes System (Grove/Ruplin)
**Database Table:** `wp_zen_hoof_codes`
- Dynamically creates shortcodes from database entries
- Uses `hoof_slug` column as shortcode name
- Predefined codes: `antelope_phone_piece`, `lamb_phone_piece`, `muskox_phone_hub`

#### General Shortcodes System (Grove Only)
**Database Table:** `wp_zen_general_shortcodes`
- Universal shortcode handler
- Any slug in database becomes available shortcode
- Example: `[main_code_from_claude2]`

#### Factory Codes Management (Grove Only)
**Database Table:** `wp_zen_factory_codes`
- Code snippet preservation system
- Admin interface for creating/managing shortcodes
- Backup system for critical functionality

## Plugin-Specific Features

### Ruplin (Primary System)
**Files:** `includes/class-zen-shortcodes.php`
**Features:**
- All core shortcodes
- Hoof codes system
- Buffalo phone system
- Elementor dynamic tags integration

### Grove (Enhanced Fallback)
**Files:** `includes/class-grove-zen-shortcodes.php`, `includes/class-grove-buffalor.php`
**Unique Features:**
- Extended phone shortcode suite
- General shortcodes system
- Factory codes management
- Admin interfaces for shortcode creation

### Beacon (Standard Fallback)
**Files:** `includes/class-beacon-zen-shortcodes.php`
**Features:**
- Core zen shortcodes only
- Basic template system
- Standard fallback functionality

### Lumora (Minimal Fallback)
**Files:** `includes/class-lumora-zen-shortcodes.php`
**Features:**
- Core zen shortcodes only
- Minimal feature set
- Last resort fallback

## Database Dependencies

### Required Tables for Full Functionality:
```sql
wp_zen_services          -- Service data
wp_zen_locations         -- Location data  
wp_zen_sitespren         -- Site configuration
wp_zen_hoof_codes        -- Dynamic shortcode storage
wp_zen_general_shortcodes -- Universal shortcode system
wp_zen_factory_codes     -- Code preservation system
```

## Template System

### Available Templates:
- **list** - Simple list display (default)
- **grid** - Grid layout
- **cards** - Card-style layout
- **full** - Complete information display

### Template Usage:
```php
[zen_services template="grid" limit="6"]
[zen_locations template="cards" pinned_first="true"]
```

## Parameter Reference

### Common Parameters Across All Shortcodes:

#### Service/Location ID Parameters:
- `id` or `service_id`/`location_id` - Specific record ID
- `field` or `dbcol` - Database column to return

#### Display Parameters:
- `template` - Display style (list, grid, cards, full)
- `limit` - Number of items (-1 for all)
- `class` - Additional CSS classes

#### Filtering Parameters:
- `pinned_first` - Show pinned items first (true/false)
- `orderby` - Sort field
- `order` - Sort direction (ASC/DESC)

#### Image Parameters:
- `size` - WordPress image size (thumbnail, medium, large, full)
- `alt` - Alternative text
- `show_image` - Include images (true/false)

## Administrative Features

### Mode Control (Available in Beacon, Grove, Lumora):
- **Automatic Mode** - Respects plugin hierarchy (default)
- **Force Active Mode** - Override hierarchy, always register
- **Disabled Mode** - Completely disable shortcodes

### Database Management:
- **Hoof Codes** - Create/edit/delete via admin interface
- **General Shortcodes** - Universal shortcode creation
- **Factory Codes** - Code snippet preservation and backup

## Security Features

### Input Sanitization:
- All parameters sanitized using WordPress functions
- SQL injection prevention via prepared statements
- XSS protection through proper escaping

### Access Control:
- Admin capabilities required for shortcode management
- Database validation before shortcode registration
- Error handling for missing data

## Integration Points

### Elementor Integration (Ruplin Only):
**File:** `includes/class-elementor-dynamic-tags.php`
**Dynamic Tags:**
- `Zen_Service_Image_Tag`
- `Zen_Service_Name_Tag`  
- `Zen_Location_Image_Tag`
- `Zen_Location_Name_Tag`

### Theme Integration:
- Template overrides supported
- CSS classes for styling hooks
- Filter hooks for customization

## Troubleshooting

### Common Issues:
1. **Shortcodes not appearing** - Check plugin hierarchy
2. **Missing data** - Verify database tables exist
3. **Template issues** - Check template parameter values
4. **Phone formatting** - Ensure phone data exists in sitespren

### Debug Information:
- Enable WordPress debug mode
- Check error logs for shortcode registration failures
- Verify database table creation
- Test with minimal plugin setup

## Best Practices

### Implementation:
1. Use Ruplin as primary plugin when possible
2. Implement Grove for enhanced phone features
3. Use Beacon/Lumora only as fallbacks
4. Always specify template parameters
5. Include fallback content for missing data

### Performance:
1. Limit shortcode usage on high-traffic pages
2. Use caching for database-heavy shortcodes
3. Optimize template files
4. Consider pagination for large datasets

### Maintenance:
1. Regular database cleanup of unused shortcodes
2. Backup factory codes before updates
3. Test shortcode functionality after plugin updates
4. Monitor error logs for shortcode issues

This hierarchical system ensures that your WordPress site always has functional shortcodes available, regardless of which specific plugins are active, while providing enhanced features when the full plugin suite is installed.