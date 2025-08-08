#!/bin/bash

# Flywheel Local Auto-Redirect Script
# This script monitors for new sites in Flywheel Local and automatically 
# redirects them to the snefuru repo structure

FLYWHEEL_DIR="/Users/kylecampbell/Local Sites"
REPO_WP_DIR="/Users/kylecampbell/Documents/repos/localrepo-snefuru4/wordpress-sites"

echo "=== Flywheel Local Auto-Redirect Setup ==="
echo "This script will:"
echo "1. Monitor Flywheel Local for new sites"
echo "2. Automatically move new site files to your repo"
echo "3. Create symlinks so Flywheel Local still works"
echo ""

# Function to setup redirect for a specific site
setup_site_redirect() {
    local sitename="$1"
    local flywheel_path="$FLYWHEEL_DIR/$sitename"
    local repo_path="$REPO_WP_DIR/$sitename"
    
    echo "Setting up redirect for: $sitename"
    
    # Check if site exists in Flywheel
    if [ ! -d "$flywheel_path" ]; then
        echo "❌ Flywheel site not found: $flywheel_path"
        return 1
    fi
    
    # Move the public directory to repo
    if [ -d "$flywheel_path/app/public" ]; then
        echo "📁 Moving $sitename files to repo..."
        mv "$flywheel_path/app/public" "$repo_path"
        
        # Create symlink back to Flywheel
        ln -sf "$repo_path" "$flywheel_path/app/public"
        
        echo "✅ Successfully redirected $sitename to repo"
        echo "   Repo location: $repo_path"
        echo "   Flywheel still works via symlink"
    else
        echo "❌ No public directory found for $sitename"
        return 1
    fi
}

# Function to scan for new sites
scan_for_new_sites() {
    echo "🔍 Scanning for new Flywheel sites..."
    
    for site_dir in "$FLYWHEEL_DIR"/*; do
        if [ -d "$site_dir" ]; then
            sitename=$(basename "$site_dir")
            repo_site_path="$REPO_WP_DIR/$sitename"
            
            # Skip if already in repo
            if [ -d "$repo_site_path" ]; then
                continue
            fi
            
            # Skip if it's a backup
            if [[ "$sitename" == *"-backup"* ]]; then
                continue
            fi
            
            # Check if it has WordPress files
            if [ -d "$site_dir/app/public" ] && [ -f "$site_dir/app/public/wp-config.php" ]; then
                echo "🆕 Found new site: $sitename"
                read -p "Move $sitename to repo? (y/n): " -n 1 -r
                echo
                if [[ $REPLY =~ ^[Yy]$ ]]; then
                    setup_site_redirect "$sitename"
                fi
            fi
        fi
    done
}

# Main menu
while true; do
    echo ""
    echo "Choose an option:"
    echo "1. Scan for new sites and redirect them"
    echo "2. Redirect a specific site (enter site name)"
    echo "3. List all Flywheel sites"
    echo "4. Exit"
    echo ""
    read -p "Enter choice (1-4): " choice
    
    case $choice in
        1)
            scan_for_new_sites
            ;;
        2)
            read -p "Enter site name: " sitename
            setup_site_redirect "$sitename"
            ;;
        3)
            echo "📋 Current Flywheel sites:"
            for site_dir in "$FLYWHEEL_DIR"/*; do
                if [ -d "$site_dir" ]; then
                    sitename=$(basename "$site_dir")
                    if [ -d "$REPO_WP_DIR/$sitename" ]; then
                        echo "  ✅ $sitename (in repo)"
                    else
                        echo "  ❌ $sitename (not in repo)"
                    fi
                fi
            done
            ;;
        4)
            echo "Exiting..."
            break
            ;;
        *)
            echo "Invalid choice. Please enter 1-4."
            ;;
    esac
done

echo "Script completed."