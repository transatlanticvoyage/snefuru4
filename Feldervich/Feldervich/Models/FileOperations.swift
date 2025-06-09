import Foundation
import SwiftUI

class FileOperations: ObservableObject {
    @Published private var navigationHistory: [URL] = []
    @Published private var currentIndex: Int = -1
    
    var canGoBack: Bool {
        currentIndex > 0
    }
    
    var canGoForward: Bool {
        currentIndex < navigationHistory.count - 1
    }
    
    func navigateToDirectory(_ url: URL) {
        // Remove any forward history when navigating to a new directory
        if currentIndex < navigationHistory.count - 1 {
            navigationHistory.removeSubrange((currentIndex + 1)...)
        }
        
        navigationHistory.append(url)
        currentIndex = navigationHistory.count - 1
        
        // Limit history size
        if navigationHistory.count > 50 {
            navigationHistory.removeFirst()
            currentIndex -= 1
        }
    }
    
    func goBack() -> URL? {
        guard canGoBack else { return nil }
        currentIndex -= 1
        return navigationHistory[currentIndex]
    }
    
    func goForward() -> URL? {
        guard canGoForward else { return nil }
        currentIndex += 1
        return navigationHistory[currentIndex]
    }
    
    func getDirectoryContents(at url: URL) -> [URL] {
        print("DEBUG: Attempting to read directory: \(url.path)")
        
        do {
            let contents = try FileManager.default.contentsOfDirectory(
                at: url,
                includingPropertiesForKeys: [
                    .isDirectoryKey,
                    .isHiddenKey,
                    .contentModificationDateKey,
                    .fileSizeKey
                ],
                options: []
            )
            
            print("DEBUG: Raw contents count: \(contents.count)")
            
            // Filter out hidden files by default (could be made configurable)
            let filtered = contents.filter { url in
                do {
                    let resourceValues = try url.resourceValues(forKeys: [.isHiddenKey])
                    let isHidden = resourceValues.isHidden ?? false
                    print("DEBUG: File \(url.lastPathComponent) - isHidden: \(isHidden)")
                    return !isHidden
                } catch {
                    print("DEBUG: Error checking if \(url.lastPathComponent) is hidden: \(error)")
                    return true
                }
            }
            
            print("DEBUG: Filtered contents count: \(filtered.count)")
            for file in filtered {
                print("DEBUG: File: \(file.lastPathComponent)")
            }
            
            return filtered
        } catch {
            print("DEBUG: Error reading directory contents: \(error)")
            return []
        }
    }
    
    func isDirectory(_ url: URL) -> Bool {
        do {
            let resourceValues = try url.resourceValues(forKeys: [.isDirectoryKey])
            return resourceValues.isDirectory ?? false
        } catch {
            return false
        }
    }
    
    func getFileSize(for url: URL) -> Int64 {
        do {
            let resourceValues = try url.resourceValues(forKeys: [.fileSizeKey])
            return Int64(resourceValues.fileSize ?? 0)
        } catch {
            return 0
        }
    }
    
    func getModificationDate(for url: URL) -> Date? {
        do {
            let resourceValues = try url.resourceValues(forKeys: [.contentModificationDateKey])
            return resourceValues.contentModificationDate
        } catch {
            return nil
        }
    }
    
    func createNewFolder(in directory: URL, name: String) -> Bool {
        let newFolderURL = directory.appendingPathComponent(name)
        
        do {
            try FileManager.default.createDirectory(at: newFolderURL, withIntermediateDirectories: false)
            return true
        } catch {
            print("Error creating new folder: \(error)")
            return false
        }
    }
    
    func renameFile(at url: URL, to newName: String) -> Bool {
        let newURL = url.deletingLastPathComponent().appendingPathComponent(newName)
        
        do {
            try FileManager.default.moveItem(at: url, to: newURL)
            return true
        } catch {
            print("Error renaming file: \(error)")
            return false
        }
    }
    
    func duplicateFile(at url: URL) -> Bool {
        let fileName = url.deletingPathExtension().lastPathComponent
        let fileExtension = url.pathExtension
        let directory = url.deletingLastPathComponent()
        
        var copyName = "\(fileName) copy"
        if !fileExtension.isEmpty {
            copyName += ".\(fileExtension)"
        }
        
        var copyURL = directory.appendingPathComponent(copyName)
        var counter = 1
        
        // Find a unique name
        while FileManager.default.fileExists(atPath: copyURL.path) {
            copyName = "\(fileName) copy \(counter)"
            if !fileExtension.isEmpty {
                copyName += ".\(fileExtension)"
            }
            copyURL = directory.appendingPathComponent(copyName)
            counter += 1
        }
        
        do {
            try FileManager.default.copyItem(at: url, to: copyURL)
            return true
        } catch {
            print("Error duplicating file: \(error)")
            return false
        }
    }
    
    func moveToTrash(_ urls: [URL]) -> Bool {
        var allSucceeded = true
        
        for url in urls {
            do {
                try FileManager.default.trashItem(at: url, resultingItemURL: nil)
            } catch {
                print("Error moving \(url.lastPathComponent) to trash: \(error)")
                allSucceeded = false
            }
        }
        
        return allSucceeded
    }
    
    func getFileType(for url: URL) -> String {
        do {
            let resourceValues = try url.resourceValues(forKeys: [.typeIdentifierKey])
            if let typeIdentifier = resourceValues.typeIdentifier {
                return typeIdentifier
            }
        } catch {
            print("Error getting file type: \(error)")
        }
        
        return "public.data"
    }
    
    func getFilePermissions(for url: URL) -> String {
        do {
            let attributes = try FileManager.default.attributesOfItem(atPath: url.path)
            if let permissions = attributes[.posixPermissions] as? NSNumber {
                let permissionValue = permissions.intValue
                return String(format: "%o", permissionValue)
            }
        } catch {
            print("Error getting file permissions: \(error)")
        }
        
        return "Unknown"
    }
} 