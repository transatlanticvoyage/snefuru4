//
//  GazeboApp.swift
//  Gazebo
//
//  Created by Kyle Campbell on 10/5/25.
//

import SwiftUI
import Cocoa
import Carbon

@main
struct GazeboApp: App {
    @NSApplicationDelegateAdaptor(AppDelegate.self) var appDelegate
    
    var body: some Scene {
        WindowGroup {
            ContentView()
        }
        .windowStyle(.hiddenTitleBar)
        .windowResizability(.contentSize)
    }
}

class AppDelegate: NSObject, NSApplicationDelegate {
    var hotKeyRef: EventHotKeyRef?
    
    func applicationDidFinishLaunching(_ aNotification: Notification) {
        // Keep normal dock icon (remove the .accessory policy)
        // Just register the hotkey, keep the app visible
        
        // Register global hotkey (Cmd+Control+K)
        registerGlobalHotkey()
        NSLog("Gazebo: Global hotkey registered (Cmd+Control+K)")
    }
    
    func registerGlobalHotkey() {
        // Install event handler first
        var eventType = EventTypeSpec(eventClass: OSType(kEventClassKeyboard), eventKind: OSType(kEventHotKeyPressed))
        let eventHandler: EventHandlerUPP = { (nextHandler, theEvent, userData) -> OSStatus in
            return AppDelegate.handleHotkey(nextHandler: nextHandler, theEvent: theEvent, userData: userData)
        }
        
        var handlerRef: EventHandlerRef?
        var status = InstallEventHandler(GetApplicationEventTarget(), eventHandler, 1, &eventType, nil, &handlerRef)
        
        if status != noErr {
            NSLog("Gazebo: Failed to install event handler, status: %d", status)
            return
        }
        
        let hotKeyID = EventHotKeyID(signature: fourCharCodeFrom("GZBO"), id: 1)
        let keyCode = UInt32(kVK_ANSI_K) // K key
        let modifiers = UInt32(cmdKey | controlKey)
        
        status = RegisterEventHotKey(keyCode, modifiers, hotKeyID, GetApplicationEventTarget(), 0, &hotKeyRef)
        
        if status == noErr {
            NSLog("Gazebo: Hotkey registration SUCCESS")
        } else {
            NSLog("Gazebo: Failed to register hotkey, status: %d", status)
        }
    }
    
    static func handleHotkey(nextHandler: EventHandlerCallRef?, theEvent: EventRef?, userData: UnsafeMutableRawPointer?) -> OSStatus {
        NSLog("Gazebo: Hotkey triggered!")
        
        // Get selected file from Finder
        if let selectedFile = getFinderSelection() {
            NSLog("Gazebo: Selected file: %@", selectedFile as NSString)
            
            // Launch Pavilion with the file
            launchPavilionWithFile(filePath: selectedFile)
        } else {
            NSLog("Gazebo: No file selected in Finder")
            showAlert(title: "No Selection", message: "Please select a file in Finder first, then use Cmd+Control+K")
        }
        
        return noErr
    }
    
    static func getFinderSelection() -> String? {
        let script = """
        tell application "Finder"
            try
                set selectedItems to selection
                if (count of selectedItems) > 0 then
                    set firstItem to item 1 of selectedItems
                    return POSIX path of (firstItem as alias)
                else
                    return ""
                end if
            on error
                return ""
            end try
        end tell
        """
        
        var error: NSDictionary?
        if let scriptObject = NSAppleScript(source: script) {
            let result = scriptObject.executeAndReturnError(&error)
            if error == nil {
                return result.stringValue
            }
        }
        
        return nil
    }
    
    static func launchPavilionWithFile(filePath: String) {
        // Write file path to a temp file that Pavilion can read
        let tempDir = NSTemporaryDirectory()
        let tempFile = tempDir.appending("gazebo-selected-file.txt")
        
        do {
            try filePath.write(toFile: tempFile, atomically: true, encoding: .utf8)
            NSLog("Gazebo: Wrote file path to %@", tempFile)
        } catch {
            NSLog("Gazebo: Failed to write temp file: %@", error.localizedDescription)
        }
        
        // Launch Pavilion using AppleScript (more reliable)
        let script = """
        tell application "Terminal"
            activate
            do script "cd /Users/kylecampbell/Documents/repos/localrepo-snefuru4/other-apps/Pavillion && npm start"
        end tell
        """
        
        var error: NSDictionary?
        if let scriptObject = NSAppleScript(source: script) {
            let result = scriptObject.executeAndReturnError(&error)
            if error == nil {
                NSLog("Gazebo: Launched Pavilion successfully")
            } else {
                NSLog("Gazebo: Failed to launch Pavilion: %@", error?.description ?? "unknown error")
            }
        }
    }
    
    static func showAlert(title: String, message: String) {
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

// Helper function to convert FourCharCode
func fourCharCodeFrom(_ string: String) -> FourCharCode {
    let utf8 = string.utf8
    let bytes = Array(utf8.prefix(4))
    let padding = Array(repeating: UInt8(0), count: 4 - bytes.count)
    let paddedBytes = bytes + padding
    
    return paddedBytes.withUnsafeBufferPointer { buffer in
        return buffer.baseAddress!.withMemoryRebound(to: FourCharCode.self, capacity: 1) { pointer in
            return CFSwapInt32BigToHost(pointer.pointee)
        }
    }
}
