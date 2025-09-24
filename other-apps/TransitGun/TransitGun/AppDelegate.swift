//
//  AppDelegate.swift
//  TransitGun
//
//  Created by Kyle Campbell on 9/24/25.
//

import Cocoa

@main
class AppDelegate: NSObject, NSApplicationDelegate {
    
    var window: NSWindow!
    private let syncManager = SyncManager()

    func applicationDidFinishLaunching(_ aNotification: Notification) {
        createWindow()
    }

    func applicationWillTerminate(_ aNotification: Notification) {
        // Insert code here to tear down your application
    }

    func applicationSupportsSecureRestorableState(_ app: NSApplication) -> Bool {
        return true
    }
    
    private func createWindow() {
        // Create fullscreen window
        let screenFrame = NSScreen.main?.frame ?? NSRect(x: 0, y: 0, width: 1440, height: 900)
        window = NSWindow(
            contentRect: screenFrame,
            styleMask: [.titled, .closable, .miniaturizable, .resizable, .fullSizeContentView],
            backing: .buffered,
            defer: false
        )
        window.title = "TransitGun"
        window.center()
        window.collectionBehavior = [.fullScreenPrimary]
        
        // Create content view
        let contentView = NSView(frame: window.contentRect(forFrameRect: window.frame))
        contentView.wantsLayer = true
        window.contentView = contentView
        
        let centerX = screenFrame.width / 2
        
        // Create title label
        let titleLabel = NSTextField(labelWithString: "TransitGun")
        titleLabel.font = NSFont.systemFont(ofSize: 32, weight: .thin)
        titleLabel.alignment = .center
        titleLabel.frame = NSRect(x: centerX - 150, y: screenFrame.height - 150, width: 300, height: 40)
        contentView.addSubview(titleLabel)
        
        // Create subtitle label
        let subtitleLabel = NSTextField(labelWithString: "Grove Plugin Development Sync Tool")
        subtitleLabel.font = NSFont.systemFont(ofSize: 16)
        subtitleLabel.textColor = .secondaryLabelColor
        subtitleLabel.alignment = .center
        subtitleLabel.frame = NSRect(x: centerX - 200, y: screenFrame.height - 180, width: 400, height: 20)
        contentView.addSubview(subtitleLabel)
        
        // Create sync button with copy button
        let syncButton = NSButton(frame: NSRect(x: centerX - 125, y: screenFrame.height - 250, width: 250, height: 40))
        syncButton.title = "Run Blumenthal Grove Sync"
        syncButton.bezelStyle = .rounded
        syncButton.font = NSFont.systemFont(ofSize: 14, weight: .medium)
        syncButton.target = self
        syncButton.action = #selector(syncButtonClicked)
        contentView.addSubview(syncButton)
        
        // Copy button for sync button text
        let copyButtonSyncText = NSButton(frame: NSRect(x: centerX - 175, y: screenFrame.height - 250, width: 40, height: 40))
        copyButtonSyncText.title = "📋"
        copyButtonSyncText.bezelStyle = .rounded
        copyButtonSyncText.target = self
        copyButtonSyncText.action = #selector(copySyncButtonText)
        copyButtonSyncText.toolTip = "Copy button text"
        contentView.addSubview(copyButtonSyncText)
        
        // Create status label
        let statusLabel = NSTextField(labelWithString: "Ready")
        statusLabel.font = NSFont.systemFont(ofSize: 16, weight: .medium)
        statusLabel.alignment = .center
        statusLabel.frame = NSRect(x: centerX - 100, y: screenFrame.height - 290, width: 200, height: 20)
        contentView.addSubview(statusLabel)
        
        // Create directory info
        let info = syncManager.getDirectoryInfo()
        
        // Source section
        let sourceLabel = NSTextField(labelWithString: "Source:")
        sourceLabel.font = NSFont.systemFont(ofSize: 16, weight: .bold)
        sourceLabel.frame = NSRect(x: 50, y: screenFrame.height - 350, width: 80, height: 20)
        contentView.addSubview(sourceLabel)
        
        let sourcePathLabel = NSTextField(labelWithString: info.sourcePath)
        sourcePathLabel.font = NSFont.monospacedSystemFont(ofSize: 12, weight: .regular)
        sourcePathLabel.textColor = .labelColor
        sourcePathLabel.frame = NSRect(x: 140, y: screenFrame.height - 350, width: screenFrame.width - 280, height: 20)
        contentView.addSubview(sourcePathLabel)
        
        let copyButtonSource = NSButton(frame: NSRect(x: screenFrame.width - 90, y: screenFrame.height - 355, width: 30, height: 30))
        copyButtonSource.title = "📋"
        copyButtonSource.bezelStyle = .rounded
        copyButtonSource.target = self
        copyButtonSource.action = #selector(copySourcePath)
        copyButtonSource.toolTip = "Copy source path"
        contentView.addSubview(copyButtonSource)
        
        let sourceStatusLabel = NSTextField(labelWithString: info.sourceExists ? "✅" : "❌")
        sourceStatusLabel.font = NSFont.systemFont(ofSize: 16)
        sourceStatusLabel.frame = NSRect(x: screenFrame.width - 50, y: screenFrame.height - 350, width: 30, height: 20)
        contentView.addSubview(sourceStatusLabel)
        
        // Target section
        let targetLabel = NSTextField(labelWithString: "Target:")
        targetLabel.font = NSFont.systemFont(ofSize: 16, weight: .bold)
        targetLabel.frame = NSRect(x: 50, y: screenFrame.height - 390, width: 80, height: 20)
        contentView.addSubview(targetLabel)
        
        let targetPathLabel = NSTextField(labelWithString: info.targetPath)
        targetPathLabel.font = NSFont.monospacedSystemFont(ofSize: 12, weight: .regular)
        targetPathLabel.textColor = .labelColor
        targetPathLabel.frame = NSRect(x: 140, y: screenFrame.height - 390, width: screenFrame.width - 280, height: 20)
        contentView.addSubview(targetPathLabel)
        
        let copyButtonTarget = NSButton(frame: NSRect(x: screenFrame.width - 90, y: screenFrame.height - 395, width: 30, height: 30))
        copyButtonTarget.title = "📋"
        copyButtonTarget.bezelStyle = .rounded
        copyButtonTarget.target = self
        copyButtonTarget.action = #selector(copyTargetPath)
        copyButtonTarget.toolTip = "Copy target path"
        contentView.addSubview(copyButtonTarget)
        
        let targetStatusLabel = NSTextField(labelWithString: info.targetExists ? "✅" : "❌")
        targetStatusLabel.font = NSFont.systemFont(ofSize: 16)
        targetStatusLabel.frame = NSRect(x: screenFrame.width - 50, y: screenFrame.height - 390, width: 30, height: 20)
        contentView.addSubview(targetStatusLabel)
        
        // Create horizontal separator
        let separator = NSBox(frame: NSRect(x: 50, y: screenFrame.height - 450, width: screenFrame.width - 100, height: 1))
        separator.boxType = .separator
        contentView.addSubview(separator)
        
        // Alpine Grove Sync section
        let alpineButton = NSButton(frame: NSRect(x: centerX - 125, y: screenFrame.height - 520, width: 250, height: 40))
        alpineButton.title = "Run Alpine Grove Sync"
        alpineButton.bezelStyle = .rounded
        alpineButton.font = NSFont.systemFont(ofSize: 14, weight: .medium)
        alpineButton.target = self
        alpineButton.action = #selector(alpineSyncButtonClicked)
        contentView.addSubview(alpineButton)
        
        // Copy button for alpine sync button text
        let copyButtonAlpineText = NSButton(frame: NSRect(x: centerX - 175, y: screenFrame.height - 520, width: 40, height: 40))
        copyButtonAlpineText.title = "📋"
        copyButtonAlpineText.bezelStyle = .rounded
        copyButtonAlpineText.target = self
        copyButtonAlpineText.action = #selector(copyAlpineSyncButtonText)
        copyButtonAlpineText.toolTip = "Copy button text"
        contentView.addSubview(copyButtonAlpineText)
        
        // Alpine directory info
        let alpineInfo = syncManager.getAlpineDirectoryInfo()
        
        // Alpine Source section
        let alpineSourceLabel = NSTextField(labelWithString: "Source:")
        alpineSourceLabel.font = NSFont.systemFont(ofSize: 16, weight: .bold)
        alpineSourceLabel.frame = NSRect(x: 50, y: screenFrame.height - 580, width: 80, height: 20)
        contentView.addSubview(alpineSourceLabel)
        
        let alpineSourcePathLabel = NSTextField(labelWithString: alpineInfo.sourcePath)
        alpineSourcePathLabel.font = NSFont.monospacedSystemFont(ofSize: 12, weight: .regular)
        alpineSourcePathLabel.textColor = .labelColor
        alpineSourcePathLabel.frame = NSRect(x: 140, y: screenFrame.height - 580, width: screenFrame.width - 280, height: 20)
        contentView.addSubview(alpineSourcePathLabel)
        
        let copyButtonAlpineSource = NSButton(frame: NSRect(x: screenFrame.width - 90, y: screenFrame.height - 585, width: 30, height: 30))
        copyButtonAlpineSource.title = "📋"
        copyButtonAlpineSource.bezelStyle = .rounded
        copyButtonAlpineSource.target = self
        copyButtonAlpineSource.action = #selector(copyAlpineSourcePath)
        copyButtonAlpineSource.toolTip = "Copy source path"
        contentView.addSubview(copyButtonAlpineSource)
        
        let alpineSourceStatusLabel = NSTextField(labelWithString: alpineInfo.sourceExists ? "✅" : "❌")
        alpineSourceStatusLabel.font = NSFont.systemFont(ofSize: 16)
        alpineSourceStatusLabel.frame = NSRect(x: screenFrame.width - 50, y: screenFrame.height - 580, width: 30, height: 20)
        contentView.addSubview(alpineSourceStatusLabel)
        
        // Alpine Target section
        let alpineTargetLabel = NSTextField(labelWithString: "Target:")
        alpineTargetLabel.font = NSFont.systemFont(ofSize: 16, weight: .bold)
        alpineTargetLabel.frame = NSRect(x: 50, y: screenFrame.height - 620, width: 80, height: 20)
        contentView.addSubview(alpineTargetLabel)
        
        let alpineTargetPathLabel = NSTextField(labelWithString: alpineInfo.targetPath)
        alpineTargetPathLabel.font = NSFont.monospacedSystemFont(ofSize: 12, weight: .regular)
        alpineTargetPathLabel.textColor = .labelColor
        alpineTargetPathLabel.frame = NSRect(x: 140, y: screenFrame.height - 620, width: screenFrame.width - 280, height: 20)
        contentView.addSubview(alpineTargetPathLabel)
        
        let copyButtonAlpineTarget = NSButton(frame: NSRect(x: screenFrame.width - 90, y: screenFrame.height - 625, width: 30, height: 30))
        copyButtonAlpineTarget.title = "📋"
        copyButtonAlpineTarget.bezelStyle = .rounded
        copyButtonAlpineTarget.target = self
        copyButtonAlpineTarget.action = #selector(copyAlpineTargetPath)
        copyButtonAlpineTarget.toolTip = "Copy target path"
        contentView.addSubview(copyButtonAlpineTarget)
        
        let alpineTargetStatusLabel = NSTextField(labelWithString: alpineInfo.targetExists ? "✅" : "❌")
        alpineTargetStatusLabel.font = NSFont.systemFont(ofSize: 16)
        alpineTargetStatusLabel.frame = NSRect(x: screenFrame.width - 50, y: screenFrame.height - 620, width: 30, height: 20)
        contentView.addSubview(alpineTargetStatusLabel)
        
        // Create horizontal separator for Hotspring section
        let hotspringSeparator = NSBox(frame: NSRect(x: 50, y: screenFrame.height - 680, width: screenFrame.width - 100, height: 1))
        hotspringSeparator.boxType = .separator
        contentView.addSubview(hotspringSeparator)
        
        // Hotspring Grove Sync section
        let hotspringButton = NSButton(frame: NSRect(x: centerX - 125, y: screenFrame.height - 750, width: 250, height: 40))
        hotspringButton.title = "Run Hotspring Grove Sync"
        hotspringButton.bezelStyle = .rounded
        hotspringButton.font = NSFont.systemFont(ofSize: 14, weight: .medium)
        hotspringButton.target = self
        hotspringButton.action = #selector(hotspringSyncButtonClicked)
        contentView.addSubview(hotspringButton)
        
        // Copy button for hotspring sync button text
        let copyButtonHotspringText = NSButton(frame: NSRect(x: centerX - 175, y: screenFrame.height - 750, width: 40, height: 40))
        copyButtonHotspringText.title = "📋"
        copyButtonHotspringText.bezelStyle = .rounded
        copyButtonHotspringText.target = self
        copyButtonHotspringText.action = #selector(copyHotspringSyncButtonText)
        copyButtonHotspringText.toolTip = "Copy button text"
        contentView.addSubview(copyButtonHotspringText)
        
        // Hotspring directory info
        let hotspringInfo = syncManager.getHotspringDirectoryInfo()
        
        // Hotspring Source section
        let hotspringSourceLabel = NSTextField(labelWithString: "Source:")
        hotspringSourceLabel.font = NSFont.systemFont(ofSize: 16, weight: .bold)
        hotspringSourceLabel.frame = NSRect(x: 50, y: screenFrame.height - 810, width: 80, height: 20)
        contentView.addSubview(hotspringSourceLabel)
        
        let hotspringSourcePathLabel = NSTextField(labelWithString: hotspringInfo.sourcePath)
        hotspringSourcePathLabel.font = NSFont.monospacedSystemFont(ofSize: 12, weight: .regular)
        hotspringSourcePathLabel.textColor = .labelColor
        hotspringSourcePathLabel.frame = NSRect(x: 140, y: screenFrame.height - 810, width: screenFrame.width - 280, height: 20)
        contentView.addSubview(hotspringSourcePathLabel)
        
        let copyButtonHotspringSource = NSButton(frame: NSRect(x: screenFrame.width - 90, y: screenFrame.height - 815, width: 30, height: 30))
        copyButtonHotspringSource.title = "📋"
        copyButtonHotspringSource.bezelStyle = .rounded
        copyButtonHotspringSource.target = self
        copyButtonHotspringSource.action = #selector(copyHotspringSourcePath)
        copyButtonHotspringSource.toolTip = "Copy source path"
        contentView.addSubview(copyButtonHotspringSource)
        
        let hotspringSourceStatusLabel = NSTextField(labelWithString: hotspringInfo.sourceExists ? "✅" : "❌")
        hotspringSourceStatusLabel.font = NSFont.systemFont(ofSize: 16)
        hotspringSourceStatusLabel.frame = NSRect(x: screenFrame.width - 50, y: screenFrame.height - 810, width: 30, height: 20)
        contentView.addSubview(hotspringSourceStatusLabel)
        
        // Hotspring Target section
        let hotspringTargetLabel = NSTextField(labelWithString: "Target:")
        hotspringTargetLabel.font = NSFont.systemFont(ofSize: 16, weight: .bold)
        hotspringTargetLabel.frame = NSRect(x: 50, y: screenFrame.height - 850, width: 80, height: 20)
        contentView.addSubview(hotspringTargetLabel)
        
        let hotspringTargetPathLabel = NSTextField(labelWithString: hotspringInfo.targetPath)
        hotspringTargetPathLabel.font = NSFont.monospacedSystemFont(ofSize: 12, weight: .regular)
        hotspringTargetPathLabel.textColor = .labelColor
        hotspringTargetPathLabel.frame = NSRect(x: 140, y: screenFrame.height - 850, width: screenFrame.width - 280, height: 20)
        contentView.addSubview(hotspringTargetPathLabel)
        
        let copyButtonHotspringTarget = NSButton(frame: NSRect(x: screenFrame.width - 90, y: screenFrame.height - 855, width: 30, height: 30))
        copyButtonHotspringTarget.title = "📋"
        copyButtonHotspringTarget.bezelStyle = .rounded
        copyButtonHotspringTarget.target = self
        copyButtonHotspringTarget.action = #selector(copyHotspringTargetPath)
        copyButtonHotspringTarget.toolTip = "Copy target path"
        contentView.addSubview(copyButtonHotspringTarget)
        
        let hotspringTargetStatusLabel = NSTextField(labelWithString: hotspringInfo.targetExists ? "✅" : "❌")
        hotspringTargetStatusLabel.font = NSFont.systemFont(ofSize: 16)
        hotspringTargetStatusLabel.frame = NSRect(x: screenFrame.width - 50, y: screenFrame.height - 850, width: 30, height: 20)
        contentView.addSubview(hotspringTargetStatusLabel)
        
        // Show window
        window.makeKeyAndOrderFront(nil)
        NSApp.activate(ignoringOtherApps: true)
    }
    
    @objc private func syncButtonClicked() {
        DispatchQueue.global(qos: .userInitiated).async { [weak self] in
            let result = self?.syncManager.runSync() ?? SyncResult(success: false, message: "Unknown error", details: "")
            
            DispatchQueue.main.async {
                let alert = NSAlert()
                if result.success {
                    alert.messageText = "Sync Complete!"
                    alert.informativeText = "Grove plugin files synced successfully."
                    alert.alertStyle = .informational
                } else {
                    alert.messageText = "Sync Failed"
                    alert.informativeText = result.message
                    alert.alertStyle = .warning
                }
                alert.runModal()
            }
        }
    }
    
    @objc private func copySyncButtonText() {
        let pasteboard = NSPasteboard.general
        pasteboard.clearContents()
        pasteboard.setString("Run Blumenthal Grove Sync", forType: .string)
        
        let alert = NSAlert()
        alert.messageText = "Copied!"
        alert.informativeText = "Button text copied to clipboard"
        alert.alertStyle = .informational
        alert.runModal()
    }
    
    @objc private func copySourcePath() {
        let info = syncManager.getDirectoryInfo()
        let pasteboard = NSPasteboard.general
        pasteboard.clearContents()
        pasteboard.setString(info.sourcePath, forType: .string)
        
        let alert = NSAlert()
        alert.messageText = "Copied!"
        alert.informativeText = "Source path copied to clipboard"
        alert.alertStyle = .informational
        alert.runModal()
    }
    
    @objc private func copyTargetPath() {
        let info = syncManager.getDirectoryInfo()
        let pasteboard = NSPasteboard.general
        pasteboard.clearContents()
        pasteboard.setString(info.targetPath, forType: .string)
        
        let alert = NSAlert()
        alert.messageText = "Copied!"
        alert.informativeText = "Target path copied to clipboard"
        alert.alertStyle = .informational
        alert.runModal()
    }
    
    @objc private func alpineSyncButtonClicked() {
        DispatchQueue.global(qos: .userInitiated).async { [weak self] in
            let result = self?.syncManager.runAlpineSync() ?? SyncResult(success: false, message: "Unknown error", details: "")
            
            DispatchQueue.main.async {
                let alert = NSAlert()
                if result.success {
                    alert.messageText = "Alpine Sync Complete!"
                    alert.informativeText = "Grove plugin files synced successfully to Alpine."
                    alert.alertStyle = .informational
                } else {
                    alert.messageText = "Alpine Sync Failed"
                    alert.informativeText = result.message
                    alert.alertStyle = .warning
                }
                alert.runModal()
            }
        }
    }
    
    @objc private func copyAlpineSyncButtonText() {
        let pasteboard = NSPasteboard.general
        pasteboard.clearContents()
        pasteboard.setString("Run Alpine Grove Sync", forType: .string)
        
        let alert = NSAlert()
        alert.messageText = "Copied!"
        alert.informativeText = "Alpine button text copied to clipboard"
        alert.alertStyle = .informational
        alert.runModal()
    }
    
    @objc private func copyAlpineSourcePath() {
        let info = syncManager.getAlpineDirectoryInfo()
        let pasteboard = NSPasteboard.general
        pasteboard.clearContents()
        pasteboard.setString(info.sourcePath, forType: .string)
        
        let alert = NSAlert()
        alert.messageText = "Copied!"
        alert.informativeText = "Alpine source path copied to clipboard"
        alert.alertStyle = .informational
        alert.runModal()
    }
    
    @objc private func copyAlpineTargetPath() {
        let info = syncManager.getAlpineDirectoryInfo()
        let pasteboard = NSPasteboard.general
        pasteboard.clearContents()
        pasteboard.setString(info.targetPath, forType: .string)
        
        let alert = NSAlert()
        alert.messageText = "Copied!"
        alert.informativeText = "Alpine target path copied to clipboard"
        alert.alertStyle = .informational
        alert.runModal()
    }
    
    @objc private func hotspringSyncButtonClicked() {
        DispatchQueue.global(qos: .userInitiated).async { [weak self] in
            let result = self?.syncManager.runHotspringSync() ?? SyncResult(success: false, message: "Unknown error", details: "")
            
            DispatchQueue.main.async {
                let alert = NSAlert()
                if result.success {
                    alert.messageText = "Hotspring Sync Complete!"
                    alert.informativeText = "Grove plugin files synced successfully to Local Sites."
                    alert.alertStyle = .informational
                } else {
                    alert.messageText = "Hotspring Sync Failed"
                    alert.informativeText = result.message
                    alert.alertStyle = .warning
                }
                alert.runModal()
            }
        }
    }
    
    @objc private func copyHotspringSyncButtonText() {
        let pasteboard = NSPasteboard.general
        pasteboard.clearContents()
        pasteboard.setString("Run Hotspring Grove Sync", forType: .string)
        
        let alert = NSAlert()
        alert.messageText = "Copied!"
        alert.informativeText = "Hotspring button text copied to clipboard"
        alert.alertStyle = .informational
        alert.runModal()
    }
    
    @objc private func copyHotspringSourcePath() {
        let info = syncManager.getHotspringDirectoryInfo()
        let pasteboard = NSPasteboard.general
        pasteboard.clearContents()
        pasteboard.setString(info.sourcePath, forType: .string)
        
        let alert = NSAlert()
        alert.messageText = "Copied!"
        alert.informativeText = "Hotspring source path copied to clipboard"
        alert.alertStyle = .informational
        alert.runModal()
    }
    
    @objc private func copyHotspringTargetPath() {
        let info = syncManager.getHotspringDirectoryInfo()
        let pasteboard = NSPasteboard.general
        pasteboard.clearContents()
        pasteboard.setString(info.targetPath, forType: .string)
        
        let alert = NSAlert()
        alert.messageText = "Copied!"
        alert.informativeText = "Hotspring target path copied to clipboard"
        alert.alertStyle = .informational
        alert.runModal()
    }
}

