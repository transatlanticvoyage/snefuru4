//
//  FinderSync.swift
//  GazeboFinderExtension
//
//  Created by Kyle Campbell on 10/5/25.
//

import Cocoa
import FinderSync

class FinderSync: FIFinderSync {
    
    private var menuIcon: NSImage? {
        if let imagePath = Bundle.main.path(forResource: "gazebo_menu_icon", ofType: "png"),
           let image = NSImage(contentsOfFile: imagePath) {
            image.size = NSSize(width: 16, height: 16)
            return image
        }
        return nil
    }
    
    override init() {
        super.init()
        
        NSLog("Gazebo FinderSync() launched from %@", Bundle.main.bundlePath as NSString)
        
        // Set up the directory we are syncing - monitor all directories
        FIFinderSyncController.default().directoryURLs = [URL(fileURLWithPath: "/")]
    }
    
    // MARK: - Primary Finder Sync protocol methods
    
    override func beginObservingDirectory(at url: URL) {
        // The user is now seeing the container's contents.
        NSLog("Gazebo beginObservingDirectory: %@", url.path as NSString)
    }
    
    override func endObservingDirectory(at url: URL) {
        // The user is no longer seeing the container's contents.
        NSLog("Gazebo endObservingDirectory: %@", url.path as NSString)
    }
    
    // MARK: - Menu and toolbar item support
    
    override func menu(for menuKind: FIMenuKind) -> NSMenu {
        let menu = NSMenu(title: "")
        
        switch menuKind {
        case .contextualMenuForItems:
            // This is the right-click menu on files/folders
            let gazeboItem = NSMenuItem(title: "GAZEBO OPTIONS", action: nil, keyEquivalent: "")
            gazeboItem.image = menuIcon
            
            // Create submenu for future stream actions
            let submenu = NSMenu(title: "GAZEBO OPTIONS")
            gazeboItem.submenu = submenu
            
            // Add placeholder submenu items for testing
            let testItem = NSMenuItem(title: "Test Action", action: #selector(testAction(_:)), keyEquivalent: "")
            submenu.addItem(testItem)
            
            submenu.addItem(NSMenuItem.separator())
            
            let streamItem1 = NSMenuItem(title: "Add to Stream 1", action: #selector(addToStream1(_:)), keyEquivalent: "")
            let streamItem2 = NSMenuItem(title: "Add to Stream 2", action: #selector(addToStream2(_:)), keyEquivalent: "")
            let streamItem3 = NSMenuItem(title: "Add to Stream 3", action: #selector(addToStream3(_:)), keyEquivalent: "")
            
            submenu.addItem(streamItem1)
            submenu.addItem(streamItem2)
            submenu.addItem(streamItem3)
            
            menu.addItem(gazeboItem)
            
        case .contextualMenuForContainer:
            // This is the right-click menu on folder backgrounds
            let gazeboItem = NSMenuItem(title: "GAZEBO OPTIONS", action: nil, keyEquivalent: "")
            gazeboItem.image = menuIcon
            
            let submenu = NSMenu(title: "GAZEBO OPTIONS")
            gazeboItem.submenu = submenu
            
            let addFolderItem = NSMenuItem(title: "Add This Folder to Stream", action: #selector(addFolderToStream(_:)), keyEquivalent: "")
            submenu.addItem(addFolderItem)
            
            menu.addItem(gazeboItem)
            
        case .contextualMenuForSidebar:
            // Sidebar context menu - skip for now
            break
            
        case .toolbarItemMenu:
            // Toolbar item menu - skip for now
            break
            
        @unknown default:
            break
        }
        
        return menu
    }
    
    // MARK: - Action Methods
    
    @objc func testAction(_ sender: AnyObject?) {
        let items = FIFinderSyncController.default().selectedItemURLs() ?? []
        
        NSLog("Gazebo Test Action triggered!")
        NSLog("Selected items count: %d", items.count)
        for item in items {
            NSLog("  - %@", item.path as NSString)
        }
        
        showAlert(title: "Gazebo Options", 
                 message: "Test successful! Extension is working.\n\nSelected \(items.count) item(s)")
    }
    
    @objc func addToStream1(_ sender: AnyObject?) {
        handleStreamAction(streamNumber: 1)
    }
    
    @objc func addToStream2(_ sender: AnyObject?) {
        handleStreamAction(streamNumber: 2)
    }
    
    @objc func addToStream3(_ sender: AnyObject?) {
        handleStreamAction(streamNumber: 3)
    }
    
    @objc func addFolderToStream(_ sender: AnyObject?) {
        let target = FIFinderSyncController.default().targetedURL()
        
        if let targetPath = target?.path {
            NSLog("Gazebo: Add folder to stream - %@", targetPath as NSString)
        } else {
            NSLog("Gazebo: Add folder to stream - no target")
        }
        
        showAlert(title: "Add Folder to Stream", 
                 message: "Folder: \(target?.lastPathComponent ?? "Unknown")\n\nThis will be connected to Pavilion.")
    }
    
    private func handleStreamAction(streamNumber: Int) {
        let items = FIFinderSyncController.default().selectedItemURLs() ?? []
        
        var message = "Adding to Stream \(streamNumber):\n\n"
        
        for item in items {
            message += "• \(item.lastPathComponent)\n"
        }
        
        message += "\nThis will communicate with Pavilion."
        
        NSLog("Gazebo: Add to Stream %d - %d items", streamNumber, items.count)
        
        showAlert(title: "Stream \(streamNumber)", message: message)
    }
    
    private func showAlert(title: String, message: String) {
        DispatchQueue.main.async {
            let alert = NSAlert()
            alert.messageText = title
            alert.informativeText = message
            alert.alertStyle = .informational
            alert.addButton(withTitle: "OK")
            alert.runModal()
        }
    }
}

