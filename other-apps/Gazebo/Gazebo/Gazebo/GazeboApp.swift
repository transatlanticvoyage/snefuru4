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
    }
}

class AppDelegate: NSObject, NSApplicationDelegate {
    var hotKeyRef: EventHotKeyRef?
    
    func applicationDidFinishLaunching(_ aNotification: Notification) {
        // Register global hotkey (Cmd+Shift+J)
        registerGlobalHotkey()
        NSLog("Gazebo: Global hotkey registered (Cmd+Shift+J)")
    }
    
    func registerGlobalHotkey() {
        let hotKeyID = EventHotKeyID(signature: OSType(fourCharCodeFrom: "GZBO"), id: 1)
        let keyCode = UInt32(kVK_ANSI_J) // J key
        let modifiers = UInt32(cmdKey | shiftKey)
        
        var eventHandler = EventHandlerUPP { (nextHandler, theEvent, userData) -> OSStatus in
            return AppDelegate.handleHotkey(nextHandler: nextHandler, theEvent: theEvent, userData: userData)
        }
        
        let status = RegisterEventHotKey(keyCode, modifiers, hotKeyID, GetApplicationEventTarget(), 0, &hotKeyRef)
        
        if status != noErr {
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
            showAlert(title: "No Selection", message: "Please select a file in Finder first, then use Cmd+Shift+J")
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
        // Create custom URL scheme to open Pavilion with file
        let urlString = "pavilion://jupiter-file?path=\(filePath.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? "")"
        
        if let url = URL(string: urlString) {
            NSWorkspace.shared.open(url)
            NSLog("Gazebo: Launched Pavilion with file")
        } else {
            NSLog("Gazebo: Failed to create URL for Pavilion")
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
