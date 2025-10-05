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
            
            // Add all 10 stream options
            for streamNumber in 1...10 {
                let streamItem = NSMenuItem(title: "Add to Stream \(streamNumber)", action: #selector(addToStream(_:)), keyEquivalent: "")
                streamItem.tag = streamNumber
                submenu.addItem(streamItem)
            }
            
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
        
        NSLog("Gazebo: Test successful! Extension is working. Selected %d item(s)", items.count)
    }
    
    @objc func addToStream(_ sender: NSMenuItem) {
        let streamNumber = sender.tag
        handleStreamAction(streamNumber: streamNumber)
    }
    
    @objc func addFolderToStream(_ sender: AnyObject?) {
        let target = FIFinderSyncController.default().targetedURL()
        
        if let targetPath = target?.path {
            NSLog("Gazebo: Add folder to stream - %@", targetPath as NSString)
        } else {
            NSLog("Gazebo: Add folder to stream - no target")
        }
    }
    
    private func handleStreamAction(streamNumber: Int) {
        let items = FIFinderSyncController.default().selectedItemURLs() ?? []
        
        guard !items.isEmpty else {
            NSLog("Gazebo: No items selected for stream %d", streamNumber)
            return
        }
        
        NSLog("Gazebo: Add to Stream %d - %d items", streamNumber, items.count)
        for item in items {
            NSLog("Gazebo: Adding item: %@", item.path as NSString)
        }
        
        // Send data to Pavilion via temp file
        addItemsToStreamInPavilion(streamNumber: streamNumber, items: items)
    }
    
    private func addItemsToStreamInPavilion(streamNumber: Int, items: [URL]) {
        let tempDir = NSTemporaryDirectory()
        let tempFile = tempDir.appending("gazebo-stream-data.json")
        
        // Create data structure for Pavilion
        let streamData: [String: Any] = [
            "streamNumber": streamNumber,
            "action": "addToStream",
            "items": items.map { [
                "name": $0.lastPathComponent,
                "path": $0.path
            ]}
        ]
        
        do {
            let jsonData = try JSONSerialization.data(withJSONObject: streamData, options: .prettyPrinted)
            try jsonData.write(to: URL(fileURLWithPath: tempFile))
            NSLog("Gazebo: Wrote stream data to %@", tempFile)
            
            // Data written successfully - Pavilion will check periodically
            NSLog("Gazebo: Stream data written successfully for stream %d", streamNumber)
        } catch {
            NSLog("Gazebo: Failed to write stream data: %@", error.localizedDescription)
        }
    }
    
    
}

