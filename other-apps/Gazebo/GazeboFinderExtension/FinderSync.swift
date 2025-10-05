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
