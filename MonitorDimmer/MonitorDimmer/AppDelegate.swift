import Cocoa

@main
class AppDelegate: NSObject, NSApplicationDelegate {
    
    var monitorManager: MonitorManager!
    var statusItem: NSStatusItem!
    var settingsWindowController: SettingsWindowController!
    private var menu: NSMenu!
    private var dockToggleMenuItem: NSMenuItem!
    
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
        
        // Initialize settings window using custom initializer
        settingsWindowController = SettingsWindowController()
        settingsWindowController.monitorManager = monitorManager
        
        // Create menu
        menu = NSMenu()
        menu.addItem(NSMenuItem(title: "Show Settings", action: #selector(showSettings), keyEquivalent: ""))
        
        // Create dock toggle menu item (starts as "Open from Dock" since app starts menu-bar-only)
        dockToggleMenuItem = NSMenuItem(title: "Open from Dock", action: #selector(toggleDockVisibility), keyEquivalent: "")
        dockToggleMenuItem.target = self
        menu.addItem(dockToggleMenuItem)
        
        menu.addItem(NSMenuItem(title: "Toggle Dimming", action: #selector(toggleDimming), keyEquivalent: ""))
        menu.addItem(NSMenuItem.separator())
        menu.addItem(NSMenuItem(title: "Quit", action: #selector(NSApplication.terminate(_:)), keyEquivalent: "q"))
        
        statusItem.menu = menu
        
        // Start as menu bar only app (no dock icon)
        NSApp.setActivationPolicy(.accessory)
        
        print("Monitor Dimmer started successfully!")
    }
    
    @objc func toggleDimming() {
        monitorManager.toggleDimming()
    }
    
    @objc func showSettings() {
        settingsWindowController.showWindow()
    }
    
    @objc func toggleDockVisibility() {
        if NSApp.activationPolicy() == .regular {
            // Currently showing in dock, hide it
            hideDockIcon()
        } else {
            // Currently hidden from dock, show it
            showDockIcon()
        }
    }
    
    private func showDockIcon() {
        // Show in dock and activate app
        NSApp.setActivationPolicy(.regular)
        NSApp.activate(ignoringOtherApps: true)
        
        // Show the settings window
        settingsWindowController.showWindow()
        
        // Ensure the window comes to front
        if let window = settingsWindowController.window {
            window.makeKeyAndOrderFront(self)
            window.orderFrontRegardless()
        }
        
        // Update menu item
        dockToggleMenuItem.title = "Hide from Dock"
        
        print("Showed dock icon with settings window visible")
    }
    
    private func hideDockIcon() {
        // Hide from dock (menu bar only)
        NSApp.setActivationPolicy(.accessory)
        
        // Update menu item
        dockToggleMenuItem.title = "Open from Dock"
        
        print("Hidden from dock - now menu bar only")
    }
    
    // Public method to update dock menu item title from other classes
    func updateDockMenuItemTitle(_ title: String) {
        dockToggleMenuItem.title = title
    }
    
    func applicationWillTerminate(_ aNotification: Notification) {
        monitorManager.stopMonitoring()
    }
    
    func applicationShouldHandleReopen(_ sender: NSApplication, hasVisibleWindows flag: Bool) -> Bool {
        // Show settings window when dock icon is clicked (only if dock icon is visible)
        if NSApp.activationPolicy() == .regular {
            settingsWindowController.showWindow()
        }
        return true
    }
} 