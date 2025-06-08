import Cocoa
import CoreGraphics

class MonitorManager {
    private var monitors: [Monitor] = []
    private var dimOverlays: [NSWindow] = []
    private var cursorTrackingTimer: Timer?
    private var isDimmingEnabled = true
    private var lastActiveMonitor: Monitor?
    
    struct Monitor {
        let id: CGDirectDisplayID
        let frame: CGRect
        let name: String
    }
    
    init() {
        detectMonitors()
        setupDimOverlays()
    }
    
    func startMonitoring() {
        // Start cursor tracking timer
        cursorTrackingTimer = Timer.scheduledTimer(withTimeInterval: 0.1, repeats: true) { _ in
            self.updateMonitorDimming()
        }
        
        // Listen for display configuration changes
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(displaysChanged),
            name: NSApplication.didChangeScreenParametersNotification,
            object: nil
        )
        
        print("Started monitoring \(monitors.count) displays")
    }
    
    func stopMonitoring() {
        cursorTrackingTimer?.invalidate()
        cursorTrackingTimer = nil
        
        // Remove all dim overlays
        for overlay in dimOverlays {
            overlay.close()
        }
        dimOverlays.removeAll()
        
        NotificationCenter.default.removeObserver(self)
        print("Stopped monitoring")
    }
    
    func toggleDimming() {
        isDimmingEnabled.toggle()
        
        if isDimmingEnabled {
            updateMonitorDimming()
            print("Dimming enabled")
        } else {
            // Hide all overlays
            for overlay in dimOverlays {
                overlay.setIsVisible(false)
            }
            print("Dimming disabled")
        }
    }
    
    private func detectMonitors() {
        monitors.removeAll()
        
        // Get all active displays
        let maxDisplays: UInt32 = 16
        var displayIDs = [CGDirectDisplayID](repeating: 0, count: Int(maxDisplays))
        var displayCount: UInt32 = 0
        
        let result = CGGetActiveDisplayList(maxDisplays, &displayIDs, &displayCount)
        
        guard result == CGError.success else {
            print("Failed to get display list")
            return
        }
        
        for i in 0..<Int(displayCount) {
            let displayID = displayIDs[i]
            let bounds = CGDisplayBounds(displayID)
            
            // Get display name
            let displayName = getDisplayName(for: displayID)
            
            let monitor = Monitor(
                id: displayID,
                frame: bounds,
                name: displayName
            )
            
            monitors.append(monitor)
            print("Detected monitor: \(displayName) at \(bounds)")
        }
    }
    
    private func getDisplayName(for displayID: CGDirectDisplayID) -> String {
        // Use a simpler approach for display names
        return "Display \(displayID)"
    }
    
    private func setupDimOverlays() {
        // Remove existing overlays
        for overlay in dimOverlays {
            overlay.close()
        }
        dimOverlays.removeAll()
        
        // Create overlay for each monitor
        for monitor in monitors {
            let overlay = createDimOverlay(for: monitor)
            dimOverlays.append(overlay)
        }
    }
    
    private func createDimOverlay(for monitor: Monitor) -> NSWindow {
        let overlay = NSWindow(
            contentRect: monitor.frame,
            styleMask: [.borderless],
            backing: .buffered,
            defer: false
        )
        
        overlay.level = .screenSaver
        overlay.backgroundColor = NSColor.black.withAlphaComponent(0.6)
        overlay.isOpaque = false
        overlay.ignoresMouseEvents = true
        overlay.collectionBehavior = [.canJoinAllSpaces, .stationary, .ignoresCycle]
        overlay.isReleasedWhenClosed = false
        
        // Initially hidden
        overlay.setIsVisible(false)
        
        return overlay
    }
    
    private func updateMonitorDimming() {
        guard isDimmingEnabled else { return }
        
        // Get current cursor position
        let cursorLocation = NSEvent.mouseLocation
        let cursorPoint = CGPoint(x: cursorLocation.x, y: cursorLocation.y)
        
        // Find which monitor contains the cursor
        var activeMonitor: Monitor?
        for monitor in monitors {
            if monitor.frame.contains(cursorPoint) {
                activeMonitor = monitor
                break
            }
        }
        
        // Only update if active monitor changed
        guard activeMonitor?.id != lastActiveMonitor?.id else { return }
        
        lastActiveMonitor = activeMonitor
        
        // Update overlay visibility
        for (index, monitor) in monitors.enumerated() {
            let overlay = dimOverlays[index]
            let shouldDim = (activeMonitor?.id != monitor.id)
            
            if shouldDim && !overlay.isVisible {
                overlay.setIsVisible(true)
                overlay.orderFront(nil)
            } else if !shouldDim && overlay.isVisible {
                overlay.setIsVisible(false)
            }
        }
        
        if let activeMonitor = activeMonitor {
            print("Active monitor: \(activeMonitor.name)")
        }
    }
    
    @objc private func displaysChanged() {
        print("Display configuration changed, updating monitors...")
        detectMonitors()
        setupDimOverlays()
    }
} 