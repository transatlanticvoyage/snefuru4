#!/bin/bash

# WordPress Site Creator for Snefuru Repo + Flywheel Local Integration
# This script creates new WordPress sites directly in the repo structure
# and sets up Flywheel Local integration

REPO_WP_DIR="/Users/kylecampbell/Documents/repos/localrepo-snefuru4/wordpress-sites"
FLYWHEEL_DIR="/Users/kylecampbell/Local Sites"

create_wordpress_site() {
    local sitename="$1"
    local site_title="$2"
    
    echo "🚀 Creating WordPress site: $sitename"
    echo "📋 Site title: $site_title"
    
    local repo_site_path="$REPO_WP_DIR/$sitename"
    local flywheel_site_path="$FLYWHEEL_DIR/$sitename"
    
    # Create site directory in repo
    mkdir -p "$repo_site_path"
    
    # Download latest WordPress
    echo "📥 Downloading latest WordPress..."
    curl -o "/tmp/wordpress.tar.gz" https://wordpress.org/latest.tar.gz
    tar -xzf "/tmp/wordpress.tar.gz" -C "/tmp/"
    
    # Move WordPress files to repo
    cp -R "/tmp/wordpress/"* "$repo_site_path/"
    rm -rf "/tmp/wordpress" "/tmp/wordpress.tar.gz"
    
    # Create basic wp-config.php
    cat > "$repo_site_path/wp-config.php" << EOF
<?php
/**
 * WordPress configuration for $sitename
 * Created via Snefuru repo WordPress site creator
 */

// Database settings (you'll need to update these in Flywheel Local)
define( 'DB_NAME', '${sitename//-/_}' );
define( 'DB_USER', 'root' );
define( 'DB_PASSWORD', 'root' );
define( 'DB_HOST', 'localhost' );
define( 'DB_CHARSET', 'utf8mb4' );
define( 'DB_COLLATE', '' );

// Authentication Keys and Salts
define( 'AUTH_KEY',         'put your unique phrase here' );
define( 'SECURE_AUTH_KEY',  'put your unique phrase here' );
define( 'LOGGED_IN_KEY',    'put your unique phrase here' );
define( 'NONCE_KEY',        'put your unique phrase here' );
define( 'AUTH_SALT',        'put your unique phrase here' );
define( 'SECURE_AUTH_SALT', 'put your unique phrase here' );
define( 'LOGGED_IN_SALT',   'put your unique phrase here' );
define( 'NONCE_SALT',       'put your unique phrase here' );

// WordPress Database Table prefix
\$table_prefix = 'wp_';

// Debugging
define( 'WP_DEBUG', true );
define( 'WP_DEBUG_LOG', true );
define( 'WP_DEBUG_DISPLAY', false );

// Absolute path to WordPress directory
if ( ! defined( 'ABSPATH' ) ) {
    define( 'ABSPATH', __DIR__ . '/' );
}

// Load WordPress
require_once ABSPATH . 'wp-settings.php';
EOF
    
    # Create README for the site
    cat > "$repo_site_path/README.md" << EOF
# $site_title

WordPress site created via Snefuru repo integration.

## Site Details
- **Site Name**: $sitename  
- **Title**: $site_title
- **Created**: $(date)
- **Repo Path**: $repo_site_path
- **Flywheel Path**: $flywheel_site_path (via symlink)

## Setup Steps
1. ✅ WordPress files created in repo
2. ⏳ Add to Flywheel Local (see instructions below)  
3. ⏳ Configure database in Flywheel Local
4. ⏳ Complete WordPress installation

## Flywheel Local Integration

To add this site to Flywheel Local:

1. Open Flywheel Local app
2. Click "Add Site" → "Import Existing Site"
3. Browse to: \`$repo_site_path\`
4. Follow Flywheel's import wizard

OR create the Flywheel structure manually:

\`\`\`bash
mkdir -p "$flywheel_site_path/app"
ln -sf "$repo_site_path" "$flywheel_site_path/app/public"
\`\`\`

## Development Notes
- All file changes should be made in VS Code (repo location)
- Changes automatically reflect in Flywheel Local
- Database managed by Flywheel Local
- Version controlled via Git in main snefuru repo
EOF

    echo "✅ WordPress site created successfully!"
    echo "📁 Site location: $repo_site_path"
    echo "📖 Check README.md for setup instructions"
    
    # Ask if user wants to create Flywheel structure
    read -p "Create Flywheel Local structure now? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        mkdir -p "$flywheel_site_path/app"
        ln -sf "$repo_site_path" "$flywheel_site_path/app/public"
        echo "✅ Flywheel Local structure created"
        echo "🚀 You can now import this site in Flywheel Local"
    fi
}

# Main script
echo "=== WordPress Site Creator for Snefuru Repo ==="
echo ""

read -p "Enter site name (e.g., 'example-business-site'): " sitename
read -p "Enter site title (e.g., 'Example Business Website'): " site_title

# Validate sitename
if [[ ! "$sitename" =~ ^[a-z0-9-]+$ ]]; then
    echo "❌ Site name must contain only lowercase letters, numbers, and hyphens"
    exit 1
fi

# Check if site already exists
if [ -d "$REPO_WP_DIR/$sitename" ]; then
    echo "❌ Site '$sitename' already exists in repo"
    exit 1
fi

if [ -d "$FLYWHEEL_DIR/$sitename" ]; then
    echo "❌ Site '$sitename' already exists in Flywheel Local"
    exit 1
fi

# Create the site
create_wordpress_site "$sitename" "$site_title"

echo ""
echo "🎉 Site creation complete!"
echo ""
echo "Next steps:"
echo "1. Open VS Code and navigate to: wordpress-sites/$sitename/"
echo "2. Import the site into Flywheel Local"
echo "3. Configure database and complete WordPress setup"
echo "4. Start developing!"