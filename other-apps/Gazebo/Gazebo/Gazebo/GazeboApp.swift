//
//  GazeboApp.swift
//  Gazebo
//
//  Created by Kyle Campbell on 10/3/25.
//

import Cocoa

class AppDelegate: NSObject, NSApplicationDelegate {
    
    var window: NSWindow?
    
    func applicationDidFinishLaunching(_ notification: Notification) {
        // Create a simple window for the host app
        window = NSWindow(
            contentRect: NSRect(x: 0, y: 0, width: 400, height: 300),
            styleMask: [.titled, .closable, .miniaturizable, .resizable],
            backing: .buffered,
            defer: false
        )
        
        window?.title = "Gazebo"
        window?.center()
        window?.makeKeyAndOrderFront(nil)
        
        // Create a simple label
        let label = NSTextField(labelWithString: "Gazebo Finder Extension Host\n\nThe Finder Extension is now active.\nRight-click files in Finder to see 'Gazebo Options'.")
        label.alignment = .center
        label.frame = NSRect(x: 20, y: 20, width: 360, height: 260)
        label.isEditable = false
        label.isSelectable = false
        label.textColor = .secondaryLabelColor
        
        window?.contentView?.addSubview(label)
        
        NSLog("Gazebo host app launched successfully")
    }
    
    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool {
        return true
    }
}

@main
struct GazeboApp {
    static func main() {
        let app = NSApplication.shared
        let delegate = AppDelegate()
        app.delegate = delegate
        app.run()
    }
}
