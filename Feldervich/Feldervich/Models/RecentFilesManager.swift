import Foundation
import CoreServices

class RecentFilesManager: ObservableObject {
    @Published var recentFiles: [URL] = []
    private var query: NSMetadataQuery?
    
    init() {
        setupMetadataQuery()
    }
    
    deinit {
        query?.stop()
    }
    
    private func setupMetadataQuery() {
        query = NSMetadataQuery()
        guard let query = query else { return }
        
        // Configure the query to find recently modified files
        query.searchScopes = [
            NSMetadataQueryUserHomeScope,
            NSMetadataQueryLocalComputerScope
        ]
        
        // Search for files that have been modified in the last 30 days
        // Exclude system files, caches, and hidden files
        let thirtyDaysAgo = Date().addingTimeInterval(-30 * 24 * 60 * 60)
        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "yyyy-MM-dd"
        let dateString = dateFormatter.string(from: thirtyDaysAgo)
        
        query.predicate = NSPredicate(format: """
            (kMDItemFSContentChangeDate >= %@) && 
            (kMDItemContentType != 'public.folder') &&
            (kMDItemDisplayName != '.*') &&
            (kMDItemPath != '*/.Trash/*') &&
            (kMDItemPath != '*/Library/Caches/*') &&
            (kMDItemPath != '*/Library/Application Support/*') &&
            (kMDItemPath != '*/.git/*') &&
            (kMDItemPath != '*/node_modules/*') &&
            (kMDItemPath != '*/.DS_Store') &&
            (kMDItemContentTypeTree = 'public.content')
        """, thirtyDaysAgo as NSDate)
        
        // Sort by most recent first
        query.sortDescriptors = [
            NSSortDescriptor(key: "kMDItemFSContentChangeDate", ascending: false)
        ]
        
        // Set up notifications
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(queryDidUpdate),
            name: .NSMetadataQueryDidUpdate,
            object: query
        )
        
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(queryDidFinishGathering),
            name: .NSMetadataQueryDidFinishGathering,
            object: query
        )
        
        // Start the query
        query.start()
    }
    
    @objc private func queryDidUpdate() {
        DispatchQueue.main.async {
            self.processQueryResults()
        }
    }
    
    @objc private func queryDidFinishGathering() {
        DispatchQueue.main.async {
            self.processQueryResults()
        }
    }
    
    private func processQueryResults() {
        guard let query = query else { return }
        
        var urls: [URL] = []
        
        for i in 0..<min(query.resultCount, 100) { // Limit to 100 recent files
            if let item = query.result(at: i) as? NSMetadataItem,
               let path = item.value(forAttribute: NSMetadataItemPathKey) as? String {
                let url = URL(fileURLWithPath: path)
                
                // Additional filtering
                if isValidRecentFile(url) {
                    urls.append(url)
                }
            }
        }
        
        // Remove duplicates and limit to 50 files
        self.recentFiles = Array(Set(urls)).prefix(50).sorted { url1, url2 in
            let date1 = getFileModificationDate(url1) ?? Date.distantPast
            let date2 = getFileModificationDate(url2) ?? Date.distantPast
            return date1 > date2
        }
    }
    
    private func isValidRecentFile(_ url: URL) -> Bool {
        var isDirectory: ObjCBool = false
        
        // Check if file exists and is not a directory
        guard FileManager.default.fileExists(atPath: url.path, isDirectory: &isDirectory),
              !isDirectory.boolValue else {
            return false
        }
        
        // Filter out certain file types and locations
        let filename = url.lastPathComponent
        let pathString = url.path.lowercased()
        
        // Skip hidden files
        if filename.hasPrefix(".") {
            return false
        }
        
        // Skip certain directories
        let excludedPaths = [
            "/system/", "/private/", "/usr/", "/bin/", "/sbin/",
            "library/caches", "library/logs", "library/application support",
            ".trash", "node_modules", ".git", ".svn"
        ]
        
        for excludedPath in excludedPaths {
            if pathString.contains(excludedPath.lowercased()) {
                return false
            }
        }
        
        // Skip certain file extensions
        let excludedExtensions = ["tmp", "log", "cache", "swp", "bak", "pid"]
        let fileExtension = url.pathExtension.lowercased()
        if excludedExtensions.contains(fileExtension) {
            return false
        }
        
        return true
    }
    
    private func getFileModificationDate(_ url: URL) -> Date? {
        do {
            let resourceValues = try url.resourceValues(forKeys: [.contentModificationDateKey])
            return resourceValues.contentModificationDate
        } catch {
            return nil
        }
    }
    
    func refreshRecents() {
        query?.stop()
        setupMetadataQuery()
    }
} 