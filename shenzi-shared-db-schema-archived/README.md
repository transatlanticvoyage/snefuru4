# Shenzi Shared Database Schema System

A centralized database schema management system for all Shenzi WordPress plugins (Snefuruplin, Grove, Lumora, Beacon, etc.).

## Features

- ✅ **Single Source of Truth**: All table definitions in one place
- ✅ **Version Management**: Automatic schema updates across plugins
- ✅ **Plugin Tracking**: Knows which plugins use the schema
- ✅ **Data Preservation**: Never deletes data on plugin deactivation
- ✅ **Automatic Deployment**: First plugin creates all tables
- ✅ **Schema Evolution**: Easy field additions and updates

## Directory Structure

```
shenzi-shared-db-schema/
├── schema-definitions.php    # All table definitions
├── schema-manager.php       # Deployment and management logic
├── README.md               # This documentation
└── plugin-integration/     # Integration examples
    ├── grove-integration.php
    ├── snefuruplin-integration.php
    └── lumora-integration.php
```

## How to Integrate

### 1. In Your Plugin's Main File

```php
// Include the schema manager
require_once plugin_dir_path(__FILE__) . '../../../shenzi-shared-db-schema/schema-manager.php';

class Your_Plugin {
    
    public function __construct() {
        // Check/update schema on plugin init
        add_action('init', array($this, 'check_schema'));
        
        // Deploy schema on activation
        register_activation_hook(__FILE__, array($this, 'on_activation'));
        register_deactivation_hook(__FILE__, array($this, 'on_deactivation'));
    }
    
    public function check_schema() {
        Shenzi_Schema_Manager::check_schema_updates('your-plugin-name');
    }
    
    public function on_activation() {
        Shenzi_Schema_Manager::deploy_schema('your-plugin-name');
    }
    
    public function on_deactivation() {
        Shenzi_Schema_Manager::unregister_plugin('your-plugin-name');
    }
}
```

### 2. In Your Admin Classes

```php
class Your_Admin {
    
    public function update_service_field() {
        // Get allowed fields from centralized schema
        $allowed_fields = Shenzi_Schema_Manager::get_allowed_fields('zen_services');
        
        $field = sanitize_text_field($_POST['field']);
        if (!in_array($field, $allowed_fields)) {
            wp_send_json_error('Invalid field name');
            return;
        }
        
        // Your update logic here...
    }
}
```

## Current Schema Tables

### zen_services
- `service_id` (PRIMARY KEY)
- `service_name`, `service_placard`, `service_moniker`, `service_sobriquet`
- `description1_short`, `description1_long`
- `rel_image1_id`, `service_slug_id`
- `is_pinned_service`, `position_in_custom_order`

### zen_locations
- `location_id` (PRIMARY KEY)
- `location_name`, `location_placard`, `location_moniker`, `location_sobriquet`
- `street`, `city`, `state_code`, `zip_code`, `country`
- `rel_image1_id`, `is_pinned_location`, `position_in_custom_order`

### zen_general_shortcodes
- `shortcode_id` (PRIMARY KEY)
- `shortcode_name`, `shortcode_slug`, `shortcode_content`
- `shortcode_description`, `shortcode_category`, `shortcode_type`
- `is_active`, `is_system`, `is_global`, `is_adminpublic`
- `position_order`, `author_user_id`, `created_at`, `updated_at`

### And more...
- `zen_orbitposts`
- `zen_factory_codes`
- `zen_cache_reports`
- `zen_lighthouse_friendly_names`
- `zen_sitespren`

## Adding New Fields

### Method 1: Update Schema Definitions (Recommended)

1. Edit `schema-definitions.php`
2. Add your new field to the appropriate table method
3. Increment the `SCHEMA_VERSION` constant
4. The next plugin that loads will auto-update all sites

### Method 2: Runtime Field Addition

```php
// Add a new field programmatically
Shenzi_Schema_Manager::add_table_field(
    'zen_services', 
    'new_field_name', 
    'TEXT DEFAULT NULL'
);
```

## Schema Status Monitoring

```php
// Get detailed schema status
$status = Shenzi_Schema_Manager::get_schema_status();

echo "Schema Version: " . $status['schema_version'];
echo "Needs Update: " . ($status['needs_update'] ? 'Yes' : 'No');
echo "Using Plugins: " . implode(', ', $status['using_plugins']);
```

## Benefits

1. **Consistency**: All plugins use identical table structures
2. **Maintenance**: Update schema in one place, deploys everywhere
3. **Safety**: Data is preserved even when plugins are deactivated
4. **Flexibility**: Easy to add new fields and tables
5. **Tracking**: Always know which plugins depend on the schema
6. **Automation**: No manual database work required

## Migration from Existing System

1. **Copy this schema system** to your repo root
2. **Update each plugin** to use the new system (see integration examples)
3. **Remove old database classes** from individual plugins
4. **Test thoroughly** before deploying to production

The system is designed to be backwards-compatible and will work alongside existing schema implementations during the transition period.