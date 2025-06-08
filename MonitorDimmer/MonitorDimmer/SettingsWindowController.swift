import Cocoa
import ServiceManagement

class SettingsWindowController: NSWindowController, NSWindowDelegate {
    
    var dimmingSlider: NSSlider!
    var dimmingLabel: NSTextField!
    var enabledCheckbox: NSButton!
    var startAtLoginCheckbox: NSButton!
    
    var monitorManager: MonitorManager?
    
    // Custom initializer that creates its own window
    init() {
        // Create the window
        let window = NSWindow(
            contentRect: NSRect(x: 0, y: 0, width: 600, height: 400),
            styleMask: [.titled, .closable, .resizable],
            backing: .buffered,
            defer: false
        )
        window.center()
        window.title = "MonitorDimmer Settings"
        window.isReleasedWhenClosed = false
        window.level = .normal
        window.backgroundColor = .windowBackgroundColor
        
        // Initialize the window controller with our window
        super.init(window: window)
        
        // Set ourselves as the window delegate to handle close button
        window.delegate = self
        
        NSLog("🔥 SettingsWindowController: Custom init called")
        
        // Manually call our setup since windowDidLoad won't be called
        setupWindow()
    }
    
    required init?(coder: NSCoder) {
        super.init(coder: coder)
        window?.delegate = self
    }
    
    override func windowDidLoad() {
        super.windowDidLoad()
        
        NSLog("🔥 SettingsWindowController: windowDidLoad called")
        setupWindow()
    }
    
    private func setupWindow() {
        NSLog("🔥 SettingsWindowController: setupWindow called")
        
        guard let window = window else {
            NSLog("❌ ERROR: No window available in setupWindow")
            return
        }
        
        setupUI()
        loadSettings()
        
        NSLog("🔥 setupWindow completed")
    }
    
    private func setupUI() {
        NSLog("🔥 SettingsWindowController: setupUI started")
        
        guard let window = window else {
            NSLog("❌ ERROR: Window not available for UI setup")
            return
        }
        
        NSLog("🔥 Setting up UI for window: \(window)")
        
        // Create main container view
        let contentView = NSView(frame: NSRect(x: 0, y: 0, width: 600, height: 400))
        contentView.wantsLayer = true
        contentView.layer?.backgroundColor = NSColor.controlBackgroundColor.cgColor
        
        NSLog("🔥 Created content view with frame: \(contentView.frame)")
        
        // Create a VERY obvious test element - using a colored view instead of text field with borders
        let testView = NSView(frame: NSRect(x: 50, y: 320, width: 500, height: 40))
        testView.wantsLayer = true
        testView.layer?.backgroundColor = NSColor.red.cgColor
        testView.layer?.borderWidth = 3.0
        testView.layer?.borderColor = NSColor.black.cgColor
        
        let testLabel = NSTextField(labelWithString: "🔥 UI TEST - CAN YOU SEE THIS? 🔥")
        testLabel.frame = NSRect(x: 10, y: 5, width: 480, height: 30)
        testLabel.font = NSFont.boldSystemFont(ofSize: 20)
        testLabel.textColor = .white
        testLabel.backgroundColor = .clear
        testLabel.alignment = .center
        testLabel.isEditable = false
        testLabel.isBezeled = false
        testLabel.drawsBackground = false
        testView.addSubview(testLabel)
        
        contentView.addSubview(testView)
        NSLog("🔥 Added test view with label: \(testView.frame)")
        
        // Title
        let titleLabel = NSTextField(labelWithString: "MonitorDimmer Settings")
        titleLabel.frame = NSRect(x: 50, y: 280, width: 500, height: 30)
        titleLabel.font = NSFont.boldSystemFont(ofSize: 16)
        titleLabel.textColor = .labelColor
        titleLabel.backgroundColor = .clear
        titleLabel.alignment = .center
        titleLabel.isEditable = false
        titleLabel.isBezeled = false
        titleLabel.drawsBackground = false
        contentView.addSubview(titleLabel)
        NSLog("🔥 Added title label")
        
        // Enable checkbox
        enabledCheckbox = NSButton(frame: NSRect(x: 50, y: 240, width: 300, height: 25))
        enabledCheckbox.setButtonType(.switch)
        enabledCheckbox.title = "Enable Monitor Dimming"
        enabledCheckbox.target = self
        enabledCheckbox.action = #selector(toggleDimming(_:))
        contentView.addSubview(enabledCheckbox)
        NSLog("🔥 Added enabled checkbox")
        
        // Start at login checkbox
        startAtLoginCheckbox = NSButton(frame: NSRect(x: 50, y: 210, width: 250, height: 25))
        startAtLoginCheckbox.setButtonType(.switch)
        startAtLoginCheckbox.title = "Start at Login"
        startAtLoginCheckbox.target = self
        startAtLoginCheckbox.action = #selector(toggleStartAtLogin(_:))
        contentView.addSubview(startAtLoginCheckbox)
        NSLog("🔥 Added start at login checkbox")
        
        // Dimming intensity label
        let intensityLabel = NSTextField(labelWithString: "Dimming Intensity:")
        intensityLabel.frame = NSRect(x: 50, y: 170, width: 150, height: 20)
        intensityLabel.isEditable = false
        intensityLabel.isBezeled = false
        intensityLabel.drawsBackground = false
        contentView.addSubview(intensityLabel)
        NSLog("🔥 Added intensity label")
        
        // Dimming slider
        dimmingSlider = NSSlider(frame: NSRect(x: 50, y: 140, width: 350, height: 25))
        dimmingSlider.minValue = 0.1
        dimmingSlider.maxValue = 0.9
        dimmingSlider.doubleValue = 0.6
        dimmingSlider.target = self
        dimmingSlider.action = #selector(sliderChanged(_:))
        contentView.addSubview(dimmingSlider)
        NSLog("🔥 Added dimming slider")
        
        // Percentage label
        dimmingLabel = NSTextField(labelWithString: "60%")
        dimmingLabel.frame = NSRect(x: 420, y: 140, width: 50, height: 25)
        dimmingLabel.alignment = .center
        dimmingLabel.isEditable = false
        dimmingLabel.isBezeled = false
        dimmingLabel.drawsBackground = false
        contentView.addSubview(dimmingLabel)
        NSLog("🔥 Added percentage label")
        
        // Close button
        let closeButton = NSButton(frame: NSRect(x: 450, y: 50, width: 100, height: 30))
        closeButton.title = "Close"
        closeButton.bezelStyle = .rounded
        closeButton.target = self
        closeButton.action = #selector(closeWindow(_:))
        contentView.addSubview(closeButton)
        NSLog("🔥 Added close button")
        
        NSLog("🔥 About to set content view with \(contentView.subviews.count) subviews")
        
        // Set the content view
        window.contentView = contentView
        window.setContentSize(contentView.frame.size)
        
        NSLog("🔥 Content view set. Window content view frame: \(window.contentView?.frame ?? CGRect.zero)")
        NSLog("🔥 Window frame after setting content: \(window.frame)")
        
        // Force refresh
        contentView.needsDisplay = true
        window.displayIfNeeded()
        
        NSLog("🔥 UI setup completed successfully with \(contentView.subviews.count) subviews")
        
        // Log all subviews for debugging
        for (index, subview) in contentView.subviews.enumerated() {
            NSLog("🔥 Subview \(index): \(type(of: subview)) at \(subview.frame)")
        }
    }
    
    private func loadSettings() {
        NSLog("🔥 SettingsWindowController: loadSettings called")
        
        guard let manager = monitorManager else {
            NSLog("❌ No monitor manager available")
            return
        }
        
        guard let enabledCheckbox = enabledCheckbox,
              let dimmingSlider = dimmingSlider,
              let startAtLoginCheckbox = startAtLoginCheckbox else {
            NSLog("❌ UI elements not initialized yet in loadSettings")
            return
        }
        
        enabledCheckbox.state = manager.isDimmingEnabled ? .on : .off
        dimmingSlider.doubleValue = manager.dimmingIntensity
        updatePercentageLabel()
        
        // Load start at login setting
        startAtLoginCheckbox.state = isStartAtLoginEnabled() ? .on : .off
        
        NSLog("🔥 Settings loaded successfully")
    }
    
    @objc private func toggleDimming(_ sender: NSButton) {
        NSLog("🔥 Toggle dimming called")
        let isEnabled = sender.state == .on
        monitorManager?.setDimmingEnabled(isEnabled)
    }
    
    @objc private func toggleStartAtLogin(_ sender: NSButton) {
        NSLog("🔥 Toggle start at login called")
        let shouldStart = sender.state == .on
        setStartAtLogin(enabled: shouldStart)
    }
    
    @objc private func sliderChanged(_ sender: NSSlider) {
        NSLog("🔥 Slider changed to: \(sender.doubleValue)")
        let intensity = sender.doubleValue
        monitorManager?.setDimmingIntensity(intensity)
        updatePercentageLabel()
    }
    
    private func updatePercentageLabel() {
        guard let dimmingSlider = dimmingSlider,
              let dimmingLabel = dimmingLabel else { return }
        
        let percentage = Int(dimmingSlider.doubleValue * 100)
        dimmingLabel.stringValue = "\(percentage)%"
        NSLog("🔥 Updated percentage label to: \(percentage)%")
    }
    
    @objc private func closeWindow(_ sender: NSButton) {
        NSLog("🔥 Close window called")
        window?.orderOut(self)
    }
    
    func showWindow() {
        NSLog("🔥 SettingsWindowController: showWindow called")
        loadSettings()
        window?.makeKeyAndOrderFront(self)
        NSApp.activate(ignoringOtherApps: true)
    }
    
    // MARK: - Login Item Management
    
    private func isStartAtLoginEnabled() -> Bool {
        if #available(macOS 13.0, *) {
            let service = SMAppService.mainApp
            return service.status == .enabled
        } else {
            guard let bundleIdentifier = Bundle.main.bundleIdentifier else { return false }
            let jobDicts = SMCopyAllJobDictionaries(kSMDomainUserLaunchd)?.takeRetainedValue() as? [[String: Any]]
            return jobDicts?.contains { job in
                job["Label"] as? String == bundleIdentifier
            } ?? false
        }
    }
    
    private func setStartAtLogin(enabled: Bool) {
        if #available(macOS 13.0, *) {
            let service = SMAppService.mainApp
            do {
                if enabled {
                    try service.register()
                    NSLog("🔥 Login item enabled successfully")
                } else {
                    try service.unregister()
                    NSLog("🔥 Login item disabled successfully")
                }
            } catch {
                NSLog("❌ Failed to \(enabled ? "enable" : "disable") login item: \(error)")
                DispatchQueue.main.async {
                    if let startAtLoginCheckbox = self.startAtLoginCheckbox {
                        startAtLoginCheckbox.state = self.isStartAtLoginEnabled() ? .on : .off
                    }
                }
            }
        } else {
            guard let bundleIdentifier = Bundle.main.bundleIdentifier else {
                NSLog("❌ Failed to get bundle identifier")
                return
            }
            
            let success = SMLoginItemSetEnabled(bundleIdentifier as CFString, enabled)
            
            if success {
                NSLog("🔥 Login item \(enabled ? "enabled" : "disabled") successfully")
            } else {
                NSLog("❌ Failed to \(enabled ? "enable" : "disable") login item")
                DispatchQueue.main.async {
                    if let startAtLoginCheckbox = self.startAtLoginCheckbox {
                        startAtLoginCheckbox.state = self.isStartAtLoginEnabled() ? .on : .off
                    }
                }
            }
        }
    }
    
    // MARK: - NSWindowDelegate
    
    func windowShouldClose(_ sender: NSWindow) -> Bool {
        NSLog("🔥 Window close button clicked - hiding from dock instead of closing")
        
        // Hide the window
        sender.orderOut(self)
        
        // Hide from dock (menu bar only)
        NSApp.setActivationPolicy(.accessory)
        
        // Update the dock toggle menu item in AppDelegate
        if let appDelegate = NSApp.delegate as? AppDelegate {
            appDelegate.updateDockMenuItemTitle("Open from Dock")
        }
        
        NSLog("🔥 App hidden from dock - now menu bar only")
        
        // Return false to prevent the window from actually closing
        return false
    }
} 