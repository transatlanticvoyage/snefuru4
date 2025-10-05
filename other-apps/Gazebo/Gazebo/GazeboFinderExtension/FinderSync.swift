//
//  FinderSync.swift
//  GazeboFinderExtension
//
//  Created by Kyle Campbell on 10/3/25.
//

import Cocoa
import FinderSync

class FinderSync: FIFinderSync {
    
    override init() {
        super.init()
        
        NSLog("Gazebo FinderSync() launched from %@", Bundle.main.bundlePath as NSString)
        
        // Set up the directory we are syncing - monitor all directories
        FIFinderSyncController.default().directoryURLs = [URL(fileURLWithPath: "/")]
    }
    
    // MARK: - Primary Finder Sync protocol methods
    
    override func beginObservingDirectory(at url: URL) {
        NSLog("Gazebo beginObservingDirectoryAtURL: %@", url.path as NSString)
    }
    
    override func endObservingDirectory(at url: URL) {
        NSLog("Gazebo endObservingDirectoryAtURL: %@", url.path as NSString)
    }
    
    // MARK: - Menu and toolbar item support
    
    override func menu(for menuKind: FIMenuKind) -> NSMenu {
        let menu = NSMenu(title: "")
        
        switch menuKind {
        case .contextualMenuForItems:
            // This is the right-click menu on files/folders
            let gazeboItem = NSMenuItem(title: "Gazebo Options", action: nil, keyEquivalent: "")
            
            // Create submenu for future stream actions
            let submenu = NSMenu(title: "Gazebo Options")
            gazeboItem.submenu = submenu
            
            // Add placeholder submenu items
            let streamItem1 = NSMenuItem(title: "Add to Stream 1", action: #selector(addToStream1(_:)), keyEquivalent: "")
            let streamItem2 = NSMenuItem(title: "Add to Stream 2", action: #selector(addToStream2(_:)), keyEquivalent: "")
            let streamItem3 = NSMenuItem(title: "Add to Stream 3", action: #selector(addToStream3(_:)), keyEquivalent: "")
            
            submenu.addItem(streamItem1)
            submenu.addItem(streamItem2)
            submenu.addItem(streamItem3)
            submenu.addItem(NSMenuItem.separator())
            
            let moreItem = NSMenuItem(title: "More Options...", action: #selector(showMoreOptions(_:)), keyEquivalent: "")
            submenu.addItem(moreItem)
            
            menu.addItem(gazeboItem)
            
        case .contextualMenuForContainer:
            // This is the right-click menu on folders (when not selecting items inside)
            let gazeboItem = NSMenuItem(title: "Gazebo Options", action: nil, keyEquivalent: "")
            
            let submenu = NSMenu(title: "Gazebo Options")
            gazeboItem.submenu = submenu
            
            let addFolderItem = NSMenuItem(title: "Add This Folder to Stream...", action: #selector(addFolderToStream(_:)), keyEquivalent: "")
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
    
    @objc func addToStream1(_ sender: AnyObject?) {
        handleStreamAction(streamNumber: 1, sender: sender)
    }
    
    @objc func addToStream2(_ sender: AnyObject?) {
        handleStreamAction(streamNumber: 2, sender: sender)
    }
    
    @objc func addToStream3(_ sender: AnyObject?) {
        handleStreamAction(streamNumber: 3, sender: sender)
    }
    
    @objc func addFolderToStream(_ sender: AnyObject?) {
        let target = FIFinderSyncController.default().targetedURL()
        
        NSLog("Gazebo: Add folder to stream - target: %@", target?.path as NSString? ?? "none")
        
        showAlert(title: "Add to Stream", 
                 message: "Folder: \(target?.lastPathComponent ?? "Unknown")\n\nThis will communicate with Pavilion to add the folder to a stream.")
    }
    
    @objc func showMoreOptions(_ sender: AnyObject?) {
        showAlert(title: "Gazebo Options", 
                 message: "More stream management options will be available here.\n\nThis will open the full Pavilion interface.")
    }
    
    private func handleStreamAction(streamNumber: Int, sender: AnyObject?) {
        let items = FIFinderSyncController.default().selectedItemURLs() ?? []
        let target = FIFinderSyncController.default().targetedURL()
        
        var message = "Stream \(streamNumber)\n\n"
        
        if !items.isEmpty {
            message += "Selected items:\n"
            for item in items {
                message += "• \(item.lastPathComponent)\n"
            }
        } else if let target = target {
            message += "Target: \(target.lastPathComponent)\n"
        }
        
        message += "\nThis will communicate with Pavilion to add these items to Stream \(streamNumber)."
        
        NSLog("Gazebo: Add to Stream %d - items: %@", streamNumber, items.map { $0.path })
        
        showAlert(title: "Add to Stream \(streamNumber)", message: message)
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

