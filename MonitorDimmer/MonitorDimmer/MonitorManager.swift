import Cocoa
import CoreGraphics

class MonitorManager {
    private var monitors: [Monitor] = []
    private var dimOverlays: [NSWindow] = []
    private var cursorTrackingTimer: Timer?
    private var validationTimer: Timer?
    private let backgroundQueue = DispatchQueue(label: "cursor.tracking", qos: .utility)
    private(set) var isDimmingEnabled = true
    private(set) var dimmingIntensity: Double = 0.6
    private var lastActiveMonitor: Monitor?
    private var lastKnownCursorPosition: CGPoint = .zero
    private var displayChangeDebounceTimer: Timer?
    
    // UserDefaults keys for persistence
    private let dimmingIntensityKey = "dimmingIntensity"
    private let dimmingEnabledKey = "dimmingEnabled"
    
    struct Monitor {
        let id: CGDirectDisplayID
        let frame: CGRect
        let name: String
    }
    
    init() {
        // Load saved settings from UserDefaults
        loadSettings()
        
        detectMonitors()
        setupDimOverlays()
    }
    
    private func loadSettings() {
        // Load dimming intensity (default to 0.6 if not set)
        let savedIntensity = UserDefaults.standard.double(forKey: dimmingIntensityKey)
        if savedIntensity > 0 {
            dimmingIntensity = max(0.1, min(0.9, savedIntensity))
        } else {
            // First time running, set default and save it
            dimmingIntensity = 0.6
            UserDefaults.standard.set(dimmingIntensity, forKey: dimmingIntensityKey)
        }
        
        // Load dimming enabled state (default to true if not set)
        if UserDefaults.standard.object(forKey: dimmingEnabledKey) != nil {
            isDimmingEnabled = UserDefaults.standard.bool(forKey: dimmingEnabledKey)
        } else {
            // First time running, set default and save it
            isDimmingEnabled = true
            UserDefaults.standard.set(isDimmingEnabled, forKey: dimmingEnabledKey)
        }
        
        print("Loaded settings - Intensity: \(Int(dimmingIntensity * 100))%, Enabled: \(isDimmingEnabled)")
    }
    
    private func saveSettings() {
        UserDefaults.standard.set(dimmingIntensity, forKey: dimmingIntensityKey)
        UserDefaults.standard.set(isDimmingEnabled, forKey: dimmingEnabledKey)
        print("Saved settings - Intensity: \(Int(dimmingIntensity * 100))%, Enabled: \(isDimmingEnabled)")
    }
    
    func startMonitoring() {
        // Start main cursor tracking timer
        cursorTrackingTimer = Timer.scheduledTimer(withTimeInterval: 0.2, repeats: true) { [weak self] _ in
            self?.backgroundQueue.async {
                self?.updateMonitorDimming()
            }
        }
        
        // Add validation timer to ensure overlays stay active (every 5 seconds)
        validationTimer = Timer.scheduledTimer(withTimeInterval: 5.0, repeats: true) { [weak self] _ in
            self?.backgroundQueue.async {
                self?.validateAndRecoverOverlays()
            }
        }
        
        // Keep timers running even when app is backgrounded
        if let cursorTimer = cursorTrackingTimer {
            RunLoop.current.add(cursorTimer, forMode: .common)
        }
        if let validTimer = validationTimer {
            RunLoop.current.add(validTimer, forMode: .common)
        }
        
        // Listen for display configuration changes
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(displaysChanged),
            name: NSApplication.didChangeScreenParametersNotification,
            object: nil
        )
        
        // Listen for app becoming active to recover from any issues
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(appDidBecomeActive),
            name: NSApplication.didBecomeActiveNotification,
            object: nil
        )
        
        print("Started monitoring \(monitors.count) displays with validation timer")
    }
    
    func stopMonitoring() {
        cursorTrackingTimer?.invalidate()
        cursorTrackingTimer = nil
        validationTimer?.invalidate()
        validationTimer = nil
        displayChangeDebounceTimer?.invalidate()
        displayChangeDebounceTimer = nil
        
        // Remove all dim overlays on main thread
        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }
            for overlay in self.dimOverlays {
                overlay.close()
            }
            self.dimOverlays.removeAll()
        }
        
        NotificationCenter.default.removeObserver(self)
        print("Stopped monitoring")
    }
    
    func toggleDimming() {
        setDimmingEnabled(!isDimmingEnabled)
    }
    
    func setDimmingEnabled(_ enabled: Bool) {
        isDimmingEnabled = enabled
        
        // Save the setting
        saveSettings()
        
        if isDimmingEnabled {
            // Trigger immediate update on background queue
            backgroundQueue.async { [weak self] in
                self?.updateMonitorDimming(forceUpdate: true)
            }
            print("Dimming enabled")
        } else {
            // Hide all overlays on main thread
            DispatchQueue.main.async { [weak self] in
                guard let self = self else { return }
                for overlay in self.dimOverlays {
                    overlay.setIsVisible(false)
                }
            }
            print("Dimming disabled")
        }
    }
    
    func setDimmingIntensity(_ intensity: Double) {
        dimmingIntensity = max(0.1, min(0.9, intensity))
        
        // Save the setting
        saveSettings()
        
        // Update all existing overlays with new intensity on main thread
        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }
            for overlay in self.dimOverlays {
                overlay.backgroundColor = NSColor.black.withAlphaComponent(self.dimmingIntensity)
            }
        }
        
        print("Dimming intensity set to \(Int(dimmingIntensity * 100))%")
    }
    
    private func validateAndRecoverOverlays() {
        guard isDimmingEnabled else { return }
        
        print("🔍 Validating overlay states...")
        
        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }
            
            var needsRecreation = false
            
            // Check if overlay count matches monitor count
            if self.dimOverlays.count != self.monitors.count {
                print("⚠️ Overlay count mismatch: \(self.dimOverlays.count) overlays vs \(self.monitors.count) monitors")
                needsRecreation = true
            }
            
            // Check if any overlays have been closed or lost their properties
            for (index, overlay) in self.dimOverlays.enumerated() {
                if !self.isOverlayValid(overlay) {
                    print("⚠️ Invalid overlay detected at index \(index)")
                    needsRecreation = true
                    break
                }
            }
            
            if needsRecreation {
                print("🔧 Recreating overlays due to validation failure")
                self.setupDimOverlays()
                
                // Force immediate update to restore proper dimming state
                self.backgroundQueue.async {
                    self.updateMonitorDimming(forceUpdate: true)
                }
            } else {
                print("✅ All overlays valid, ensuring correct dimming state")
                // Ensure correct dimming state is maintained
                self.backgroundQueue.async {
                    self.updateMonitorDimming(forceUpdate: true)
                }
            }
        }
    }
    
    private func isOverlayValid(_ overlay: NSWindow) -> Bool {
        // Check if window is still valid and has correct properties
        return overlay.level == .screenSaver &&
               overlay.ignoresMouseEvents &&
               overlay.collectionBehavior.contains(.canJoinAllSpaces) &&
               overlay.collectionBehavior.contains(.stationary) &&
               overlay.collectionBehavior.contains(.ignoresCycle)
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
        return "Display \(displayID)"
    }
    
    private func setupDimOverlays() {
        // Remove existing overlays on main thread
        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }
            for overlay in self.dimOverlays {
                overlay.close()
            }
            self.dimOverlays.removeAll()
            
            // Create overlay for each monitor
            for monitor in self.monitors {
                let overlay = self.createDimOverlay(for: monitor)
                self.dimOverlays.append(overlay)
            }
            
            print("✅ Created \(self.dimOverlays.count) overlay windows")
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
        overlay.backgroundColor = NSColor.black.withAlphaComponent(dimmingIntensity)
        overlay.isOpaque = false
        overlay.ignoresMouseEvents = true
        overlay.collectionBehavior = [.canJoinAllSpaces, .stationary, .ignoresCycle]
        overlay.isReleasedWhenClosed = false
        overlay.hidesOnDeactivate = false
        
        // Initially hidden
        overlay.setIsVisible(false)
        
        return overlay
    }
    
    private func updateMonitorDimming(forceUpdate: Bool = false) {
        guard isDimmingEnabled else { 
            print("🚫 Dimming disabled, skipping update")
            return 
        }
        
        // Get current cursor position (this is safe to call from background thread)
        let cursorLocation = NSEvent.mouseLocation
        let cursorPoint = CGPoint(x: cursorLocation.x, y: cursorLocation.y)
        
        // Store cursor position for validation
        lastKnownCursorPosition = cursorPoint
        
        print("🖱️ Cursor at: (\(Int(cursorPoint.x)), \(Int(cursorPoint.y)))")
        
        // Find which monitor contains the cursor
        var activeMonitor: Monitor?
        for monitor in monitors {
            if monitor.frame.contains(cursorPoint) {
                activeMonitor = monitor
                print("🎯 Cursor is on monitor: \(monitor.name)")
                break
            }
        }
        
        if activeMonitor == nil {
            print("⚠️ Cursor is not on any detected monitor!")
        }
        
        // Only update if active monitor changed or forced update
        guard forceUpdate || activeMonitor?.id != lastActiveMonitor?.id else { 
            print("⏭️ No monitor change, skipping update")
            return 
        }
        
        lastActiveMonitor = activeMonitor
        print("🔄 Monitor changed or force update - updating overlays")
        
        // Update overlay visibility on main thread
        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }
            
            // Ensure we have the same number of overlays as monitors
            guard self.dimOverlays.count == self.monitors.count else {
                print("❌ Overlay count mismatch, rebuilding overlays")
                self.setupDimOverlays()
                return
            }
            
            print("🎬 Updating \(self.monitors.count) monitors:")
            
            for (index, monitor) in self.monitors.enumerated() {
                let overlay = self.dimOverlays[index]
                let shouldDim = (activeMonitor?.id != monitor.id)
                
                print("   Monitor \(monitor.name): shouldDim=\(shouldDim), isVisible=\(overlay.isVisible)")
                
                if shouldDim && !overlay.isVisible {
                    // Ensure overlay properties are still correct before showing
                    overlay.level = .screenSaver
                    overlay.ignoresMouseEvents = true
                    overlay.collectionBehavior = [.canJoinAllSpaces, .stationary, .ignoresCycle]
                    overlay.hidesOnDeactivate = false
                    
                    overlay.setIsVisible(true)
                    overlay.orderFront(nil)
                    print("📺 DIMMED monitor: \(monitor.name)")
                } else if !shouldDim && overlay.isVisible {
                    overlay.setIsVisible(false)
                    print("💡 UNDIMMED monitor: \(monitor.name)")
                } else {
                    print("➡️ No change for monitor: \(monitor.name)")
                }
            }
        }
        
        if let activeMonitor = activeMonitor {
            print("✅ Active monitor: \(activeMonitor.name)")
        } else {
            print("❌ No active monitor detected")
        }
    }
    
    @objc private func displaysChanged() {
        print("🔄 Display configuration change detected")
        
        // Debounce display changes to avoid excessive recreation
        displayChangeDebounceTimer?.invalidate()
        displayChangeDebounceTimer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: false) { [weak self] _ in
            print("⚙️ Processing debounced display configuration change...")
            
            // Do heavy lifting on background queue
            self?.backgroundQueue.async {
                self?.detectMonitors()
                self?.setupDimOverlays()
                
                // Force immediate update after display change
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                    self?.backgroundQueue.async {
                        self?.updateMonitorDimming(forceUpdate: true)
                    }
                }
            }
        }
    }
    
    @objc private func appDidBecomeActive() {
        print("🔄 App became active, validating overlay state...")
        
        // Force immediate validation when app becomes active
        backgroundQueue.async { [weak self] in
            self?.validateAndRecoverOverlays()
        }
    }
} 