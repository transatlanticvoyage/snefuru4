#!/bin/bash

# Create Gazebo Finder Extension project
cd "$(dirname "$0")"

# Create the main project directory structure
mkdir -p Gazebo.xcodeproj
mkdir -p Gazebo
mkdir -p GazeboFinderExtension

# Create main app files
cat > Gazebo/AppDelegate.swift << 'EOF'
import Cocoa

@main
class AppDelegate: NSObject, NSApplicationDelegate {
    
    func applicationDidFinishLaunching(_ aNotification: Notification) {
        // Insert code here to initialize your application
        print("Gazebo app launched")
    }
    
    func applicationWillTerminate(_ aNotification: Notification) {
        // Insert code here to tear down your application
    }
    
    func applicationSupportsSecureRestorableState(_ app: NSApplication) -> Bool {
        return true
    }
}
EOF

# Create main app Info.plist
cat > Gazebo/Info.plist << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleDevelopmentRegion</key>
    <string>$(DEVELOPMENT_LANGUAGE)</string>
    <key>CFBundleExecutable</key>
    <string>$(EXECUTABLE_NAME)</string>
    <key>CFBundleIconFile</key>
    <string></string>
    <key>CFBundleIdentifier</key>
    <string>$(PRODUCT_BUNDLE_IDENTIFIER)</string>
    <key>CFBundleInfoDictionaryVersion</key>
    <string>6.0</string>
    <key>CFBundleName</key>
    <string>$(PRODUCT_NAME)</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0</string>
    <key>CFBundleVersion</key>
    <string>1</string>
    <key>LSMinimumSystemVersion</key>
    <string>$(MACOSX_DEPLOYMENT_TARGET)</string>
    <key>NSMainStoryboardFile</key>
    <string>Main</string>
    <key>NSPrincipalClass</key>
    <string>NSApplication</string>
</dict>
</plist>
EOF

# Create Finder Extension files
cat > GazeboFinderExtension/FinderSync.swift << 'EOF'
import Cocoa
import FinderSync

class FinderSync: FIFinderSync {
    
    override init() {
        super.init()
        
        NSLog("FinderSync() launched from %@", Bundle.main.bundlePath)
        
        // Set up the directory we are syncing
        FIFinderSyncController.default().directoryURLs = [URL(fileURLWithPath: "/")]
    }
    
    // MARK: - Primary Finder Sync protocol methods
    
    override func beginObservingDirectory(at url: URL) {
        NSLog("beginObservingDirectoryAtURL: %@", url.path)
    }
    
    override func endObservingDirectory(at url: URL) {
        NSLog("endObservingDirectoryAtURL: %@", url.path)
    }
    
    // MARK: - Menu and toolbar item support
    
    override func menu(for menuKind: FIMenuKind) -> NSMenu {
        let menu = NSMenu(title: "")
        
        switch menuKind {
        case .contextualMenuForItems:
            // This is the right-click menu on files/folders
            let gazeboItem = NSMenuItem(title: "Gazebo Options", action: nil, keyEquivalent: "")
            
            // Create submenu for future expansion
            let submenu = NSMenu(title: "Gazebo Options")
            gazeboItem.submenu = submenu
            
            // Add placeholder submenu item
            let placeholderItem = NSMenuItem(title: "Stream Actions (Coming Soon)", action: #selector(placeholderAction(_:)), keyEquivalent: "")
            submenu.addItem(placeholderItem)
            
            menu.addItem(gazeboItem)
            
        case .contextualMenuForContainer:
            // This is the right-click menu on folders
            let gazeboItem = NSMenuItem(title: "Gazebo Options", action: nil, keyEquivalent: "")
            
            let submenu = NSMenu(title: "Gazebo Options")
            gazeboItem.submenu = submenu
            
            let placeholderItem = NSMenuItem(title: "Folder Actions (Coming Soon)", action: #selector(placeholderAction(_:)), keyEquivalent: "")
            submenu.addItem(placeholderItem)
            
            menu.addItem(gazeboItem)
            
        case .contextualMenuForSidebar:
            // Sidebar context menu
            break
            
        case .toolbarItemMenu:
            // Toolbar item menu
            break
            
        @unknown default:
            break
        }
        
        return menu
    }
    
    @objc func placeholderAction(_ sender: AnyObject?) {
        NSLog("Gazebo placeholder action triggered")
        
        // Show a simple alert for now
        let alert = NSAlert()
        alert.messageText = "Gazebo Options"
        alert.informativeText = "Stream actions will be available here soon!"
        alert.alertStyle = .informational
        alert.addButton(withTitle: "OK")
        alert.runModal()
    }
}
EOF

# Create Finder Extension Info.plist
cat > GazeboFinderExtension/Info.plist << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleDevelopmentRegion</key>
    <string>$(DEVELOPMENT_LANGUAGE)</string>
    <key>CFBundleDisplayName</key>
    <string>Gazebo Finder Extension</string>
    <key>CFBundleExecutable</key>
    <string>$(EXECUTABLE_NAME)</string>
    <key>CFBundleIdentifier</key>
    <string>$(PRODUCT_BUNDLE_IDENTIFIER)</string>
    <key>CFBundleInfoDictionaryVersion</key>
    <string>6.0</string>
    <key>CFBundleName</key>
    <string>$(PRODUCT_NAME)</string>
    <key>CFBundlePackageType</key>
    <string>XPC!</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0</string>
    <key>CFBundleVersion</key>
    <string>1</string>
    <key>LSMinimumSystemVersion</key>
    <string>$(MACOSX_DEPLOYMENT_TARGET)</string>
    <key>NSExtension</key>
    <dict>
        <key>NSExtensionAttributes</key>
        <dict>
            <key>NSExtensionPrincipalClass</key>
            <string>FinderSync</string>
        </dict>
        <key>NSExtensionPointIdentifier</key>
        <string>com.apple.FinderSync</string>
    </dict>
    <key>NSHumanReadableCopyright</key>
    <string>Copyright © 2024. All rights reserved.</string>
</dict>
</plist>
EOF

echo "Gazebo project structure created!"
echo "Next: Open Xcode and create a new macOS app project, then add these files."