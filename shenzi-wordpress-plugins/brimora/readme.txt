=== Brimora ===
Contributors: brimora-team
Tags: elementor, background, database, zen-services, dynamic-content
Requires at least: 5.0
Tested up to: 6.4
Requires PHP: 7.4
Stable tag: 1.0.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Independent Elementor integration for zen database services - dynamic backgrounds and data binding.

== Description ==

Brimora is an independent WordPress plugin that creates a bridge between Elementor page builder and zen database services. It allows you to dynamically assign background images to Elementor containers based on data stored in zen_services database table.

**Key Features:**

* **Dynamic Backgrounds**: Automatically pull background images from zen_services database
* **Elementor Integration**: Seamless custom controls in Elementor's interface  
* **Service Selection**: Dropdown to choose from available services
* **Custom Codes**: Assign custom codes for CSS targeting
* **Background Controls**: Full control over size, position, and repeat
* **Overlay Support**: Optional overlay with customizable colors
* **Responsive Images**: Automatic responsive image handling
* **Independent**: No interference with other plugins or schemas
* **Performance Optimized**: Efficient AJAX loading and caching

**How It Works:**

1. Install and activate Brimora
2. Edit any page with Elementor
3. Select a Container element
4. Go to Style tab → "Zen Service Background"
5. Choose a service from the dropdown
6. Configure background display options
7. The container will dynamically load the service's image as background

**Database Integration:**

Brimora safely reads from existing zen_services tables without making any schema modifications. It follows the relationship: zen_services.rel_image1_id → wp_posts (attachments) to fetch the appropriate image URLs.

**Requirements:**

* Elementor Plugin (active)
* Existing zen_services database table
* PHP 7.4 or higher
* WordPress 5.0 or higher

== Installation ==

1. Upload the `brimora` folder to the `/wp-content/plugins/` directory
2. Activate the plugin through the 'Plugins' menu in WordPress
3. Ensure Elementor is installed and activated
4. Go to Settings → Brimora to verify database connections
5. Start using zen service backgrounds in Elementor containers

== Frequently Asked Questions ==

= Does this plugin modify my database? =

No, Brimora only reads from existing zen_services tables. It does not create, modify, or delete any database tables or data.

= Will this interfere with other plugins? =

No, Brimora is designed to be completely independent. It uses its own namespaced functions and does not register any shortcodes that could conflict with other plugins.

= What happens if Elementor is deactivated? =

Brimora will safely deactivate its functionality and show an admin notice. No errors or conflicts will occur.

= Can I use custom CSS with service backgrounds? =

Yes, Brimora adds CSS classes like `brimora-service-id-{ID}` and `brimora-service-code-{CODE}` for easy targeting.

= Does it work with responsive design? =

Yes, Brimora automatically handles responsive images and provides different image sizes based on screen resolution.

== Screenshots ==

1. Elementor container with Zen Service Background controls
2. Service selection dropdown with available services
3. Background configuration options
4. Admin settings page showing plugin status
5. Example container with dynamic service background

== Changelog ==

= 1.0.0 =
* Initial release
* Dynamic background integration with zen_services
* Elementor container controls
* AJAX image loading
* Responsive image support
* Overlay functionality
* Admin settings page
* Debug mode support

== Upgrade Notice ==

= 1.0.0 =
Initial release of Brimora plugin.

== Developer Notes ==

**Hook Reference:**

* `brimoraBackgroundLoaded` - Custom event fired when background loads successfully
* `brimoraBackgroundError` - Custom event fired when background loading fails

**JavaScript Functions:**

* `brimoraRefreshBackgrounds()` - Reload all backgrounds
* `brimoraDebugMode(true/false)` - Enable/disable debug mode

**CSS Classes:**

* `.brimora-zen-service` - Base class for containers with service backgrounds
* `.brimora-bg-loaded` - Added when background loads successfully
* `.brimora-bg-error` - Added when background loading fails
* `.brimora-loading` - Added during background loading
* `.brimora-service-id-{ID}` - Service-specific targeting
* `.brimora-service-code-{CODE}` - Custom code targeting

== Support ==

For support and documentation, visit: https://github.com/transatlanticvoyage/brimora