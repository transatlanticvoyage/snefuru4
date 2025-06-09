import Foundation
import SwiftUI

class PinnedFoldersManager: ObservableObject {
    @Published var pinnedFolders: [URL] = []
    
    private let userDefaults = UserDefaults.standard
    private let pinnedFoldersKey = "FeldervichPinnedFolders"
    
    init() {
        loadPinnedFolders()
    }
    
    func addPinnedFolder(_ url: URL) {
        // Check if folder already exists
        if !pinnedFolders.contains(url) {
            pinnedFolders.append(url)
            savePinnedFolders()
        }
    }
    
    func removePinnedFolder(_ url: URL) {
        pinnedFolders.removeAll { $0 == url }
        savePinnedFolders()
    }
    
    func movePinnedFolder(from source: IndexSet, to destination: Int) {
        pinnedFolders.move(fromOffsets: source, toOffset: destination)
        savePinnedFolders()
    }
    
    func isPinned(_ url: URL) -> Bool {
        return pinnedFolders.contains(url)
    }
    
    private func savePinnedFolders() {
        let bookmarks = pinnedFolders.compactMap { url -> Data? in
            do {
                return try url.bookmarkData(
                    options: .withSecurityScope,
                    includingResourceValuesForKeys: nil,
                    relativeTo: nil
                )
            } catch {
                print("Error creating bookmark for \(url): \(error)")
                return nil
            }
        }
        
        userDefaults.set(bookmarks, forKey: pinnedFoldersKey)
    }
    
    private func loadPinnedFolders() {
        guard let bookmarks = userDefaults.array(forKey: pinnedFoldersKey) as? [Data] else {
            return
        }
        
        pinnedFolders = bookmarks.compactMap { bookmark -> URL? in
            do {
                var isStale = false
                let url = try URL(
                    resolvingBookmarkData: bookmark,
                    options: .withSecurityScope,
                    relativeTo: nil,
                    bookmarkDataIsStale: &isStale
                )
                
                if isStale {
                    // Bookmark is stale, try to refresh it
                    print("Bookmark is stale for URL: \(url)")
                    // Could implement bookmark refresh logic here
                }
                
                // Check if the folder still exists
                var isDirectory: ObjCBool = false
                if FileManager.default.fileExists(atPath: url.path, isDirectory: &isDirectory) && isDirectory.boolValue {
                    return url
                } else {
                    print("Pinned folder no longer exists: \(url)")
                    return nil
                }
            } catch {
                print("Error resolving bookmark: \(error)")
                return nil
            }
        }
        
        // Remove any folders that no longer exist
        if pinnedFolders.count != bookmarks.count {
            savePinnedFolders()
        }
    }
    
    func refreshPinnedFolders() {
        // Remove any folders that no longer exist
        let existingFolders = pinnedFolders.filter { url in
            var isDirectory: ObjCBool = false
            return FileManager.default.fileExists(atPath: url.path, isDirectory: &isDirectory) && isDirectory.boolValue
        }
        
        if existingFolders.count != pinnedFolders.count {
            pinnedFolders = existingFolders
            savePinnedFolders()
        }
    }
    
    func clearAllPinnedFolders() {
        pinnedFolders.removeAll()
        savePinnedFolders()
    }
    
    func exportPinnedFolders() -> String {
        return pinnedFolders.map { $0.path }.joined(separator: "\n")
    }
    
    func importPinnedFolders(from text: String) {
        let paths = text.components(separatedBy: .newlines)
            .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
            .filter { !$0.isEmpty }
        
        for path in paths {
            let url = URL(fileURLWithPath: path)
            var isDirectory: ObjCBool = false
            
            if FileManager.default.fileExists(atPath: url.path, isDirectory: &isDirectory) && isDirectory.boolValue {
                addPinnedFolder(url)
            }
        }
    }
} 