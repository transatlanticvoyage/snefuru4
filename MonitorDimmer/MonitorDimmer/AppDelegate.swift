import Cocoa

@main
class AppDelegate: NSObject, NSApplicationDelegate {
    
    var monitorManager: MonitorManager!
    var statusItem: NSStatusItem!
    
    func applicationDidFinishLaunching(_ aNotification: Notification) {
        // Create status bar item
        statusItem = NSStatusBar.system.statusItem(withLength: NSStatusItem.squareLength)
        
        if let button = statusItem.button {
            button.image = NSImage(systemSymbolName: "display", accessibilityDescription: "Monitor Dimmer")
            button.action = #selector(toggleDimming)
            button.target = self
        }
        
        // Initialize monitor manager
        monitorManager = MonitorManager()
        monitorManager.startMonitoring()
        
        // Create menu
        let menu = NSMenu()
        menu.addItem(NSMenuItem(title: "Toggle Dimming", action: #selector(toggleDimming), keyEquivalent: ""))
        menu.addItem(NSMenuItem.separator())
        menu.addItem(NSMenuItem(title: "Quit", action: #selector(NSApplication.terminate(_:)), keyEquivalent: "q"))
        
        statusItem.menu = menu
        
        print("Monitor Dimmer started successfully!")
    }
    
    @objc func toggleDimming() {
        monitorManager.toggleDimming()
    }
    
    func applicationWillTerminate(_ aNotification: Notification) {
        monitorManager.stopMonitoring()
    }
    
    func applicationShouldHandleReopen(_ sender: NSApplication, hasVisibleWindows flag: Bool) -> Bool {
        return false
    }
} 