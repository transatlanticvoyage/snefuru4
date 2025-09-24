import Cocoa

@main
class AppDelegate: NSObject, NSApplicationDelegate {
    
    @IBOutlet var window: NSWindow!
    @IBOutlet var syncButton: NSButton!
    @IBOutlet var statusLabel: NSTextField!
    @IBOutlet var sourcePathLabel: NSTextField!
    @IBOutlet var targetPathLabel: NSTextField!
    @IBOutlet var sourceStatusIndicator: NSTextField!
    @IBOutlet var targetStatusIndicator: NSTextField!
    @IBOutlet var progressIndicator: NSProgressIndicator!
    @IBOutlet var resultTextView: NSTextView!
    
    private let syncManager = SyncManager()
    
    func applicationDidFinishLaunching(_ aNotification: Notification) {
        window.title = "TransitGun"
        setupUI()
        loadDirectoryInfo()
    }
    
    func applicationWillTerminate(_ aNotification: Notification) {
        
    }
    
    func applicationSupportsSecureRestorableState(_ app: NSApplication) -> Bool {
        return true
    }
    
    private func setupUI() {
        statusLabel.stringValue = "Ready"
        progressIndicator.isHidden = true
        resultTextView.isHidden = true
        
        syncButton.target = self
        syncButton.action = #selector(syncButtonClicked)
    }
    
    private func loadDirectoryInfo() {
        let info = syncManager.getDirectoryInfo()
        
        sourcePathLabel.stringValue = info.sourcePath
        targetPathLabel.stringValue = info.targetPath
        
        sourceStatusIndicator.stringValue = info.sourceExists ? "●" : "●"
        sourceStatusIndicator.textColor = info.sourceExists ? NSColor.systemGreen : NSColor.systemRed
        sourceStatusIndicator.toolTip = info.sourceExists ? "Directory exists" : "Directory not found"
        
        targetStatusIndicator.stringValue = info.targetExists ? "●" : "●"
        targetStatusIndicator.textColor = info.targetExists ? NSColor.systemGreen : NSColor.systemRed  
        targetStatusIndicator.toolTip = info.targetExists ? "Directory exists" : "Directory not found"
    }
    
    @objc private func syncButtonClicked() {
        syncButton.isEnabled = false
        progressIndicator.isHidden = false
        progressIndicator.startAnimation(nil)
        statusLabel.stringValue = "Running Blumenthal Grove Sync..."
        resultTextView.isHidden = true
        
        DispatchQueue.global(qos: .userInitiated).async { [weak self] in
            let result = self?.syncManager.runSync() ?? SyncResult(success: false, message: "Unknown error", details: "")
            
            DispatchQueue.main.async {
                self?.handleSyncResult(result)
            }
        }
    }
    
    private func handleSyncResult(_ result: SyncResult) {
        syncButton.isEnabled = true
        progressIndicator.stopAnimation(nil)
        progressIndicator.isHidden = true
        
        if result.success {
            statusLabel.stringValue = "Sync Complete!"
            statusLabel.textColor = NSColor.systemGreen
            resultTextView.string = result.details
            loadDirectoryInfo()
        } else {
            statusLabel.stringValue = "Sync Failed"
            statusLabel.textColor = NSColor.systemRed
            resultTextView.string = "\(result.message)\n\n\(result.details)"
        }
        
        resultTextView.isHidden = false
        
        DispatchQueue.main.asyncAfter(deadline: .now() + 5.0) { [weak self] in
            self?.statusLabel.stringValue = "Ready"
            self?.statusLabel.textColor = NSColor.labelColor
            self?.resultTextView.isHidden = true
        }
    }
}