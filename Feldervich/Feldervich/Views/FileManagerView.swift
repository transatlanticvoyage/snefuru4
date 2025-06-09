import SwiftUI
import UniformTypeIdentifiers

struct PathComponent: Identifiable, Hashable {
    let id = UUID()
    let name: String
    let url: URL
    
    func hash(into hasher: inout Hasher) {
        hasher.combine(id)
    }
    
    static func == (lhs: PathComponent, rhs: PathComponent) -> Bool {
        lhs.id == rhs.id
    }
}

struct FileManagerView: View {
    @ObservedObject var fileOperations: FileOperations
    @ObservedObject var pinnedFoldersManager: PinnedFoldersManager
    @Binding var selectedURL: URL?
    
    @State private var selectedFiles: Set<URL> = []
    @State private var showingAlert = false
    @State private var alertMessage = ""
    @State private var viewMode: ViewMode = .list
    @State private var sortBy: SortOption = .name
    @State private var searchText = ""
    @State private var recentFiles: [URL] = []
    
    // Special URL identifier for Recents
    private let recentsURL = URL(string: "feldervich://recents")!
    
    enum ViewMode: String, CaseIterable {
        case list = "List"
        case icons = "Icons"
    }
    
    enum SortOption: String, CaseIterable {
        case name = "Name"
        case dateModified = "Date Modified"
        case size = "Size"
        case type = "Type"
    }
    
    var filteredFiles: [URL] {
        guard let selectedURL = selectedURL else { 
            print("DEBUG: selectedURL is nil")
            return [] 
        }
        
        // Handle Recents special case
        if selectedURL == recentsURL {
            print("DEBUG: Showing recent files: \(recentFiles.count)")
            let filtered = searchText.isEmpty ? recentFiles : recentFiles.filter { url in
                url.lastPathComponent.localizedCaseInsensitiveContains(searchText)
            }
            return filtered
        }
        
        print("DEBUG: Getting directory contents for: \(selectedURL.path)")
        let files = fileOperations.getDirectoryContents(at: selectedURL)
        print("DEBUG: Got \(files.count) files from fileOperations")
        
        let filtered = searchText.isEmpty ? files : files.filter { url in
            url.lastPathComponent.localizedCaseInsensitiveContains(searchText)
        }
        
        print("DEBUG: After search filter: \(filtered.count) files")
        
        let sorted = filtered.sorted { url1, url2 in
            switch sortBy {
            case .name:
                return url1.lastPathComponent.localizedCaseInsensitiveCompare(url2.lastPathComponent) == .orderedAscending
            case .dateModified:
                let date1 = fileOperations.getModificationDate(for: url1) ?? Date.distantPast
                let date2 = fileOperations.getModificationDate(for: url2) ?? Date.distantPast
                return date1 > date2
            case .size:
                let size1 = fileOperations.getFileSize(for: url1)
                let size2 = fileOperations.getFileSize(for: url2)
                return size1 > size2
            case .type:
                let ext1 = url1.pathExtension.lowercased()
                let ext2 = url2.pathExtension.lowercased()
                return ext1.localizedCaseInsensitiveCompare(ext2) == .orderedAscending
            }
        }
        
        print("DEBUG: Final sorted file count: \(sorted.count)")
        return sorted
    }
    
    var body: some View {
        VStack(spacing: 0) {
            // Navigation Bar
            navigationBar
            
            // Search Bar
            searchBar
            
            // File List
            if selectedURL != nil {
                FileListView(
                    files: filteredFiles,
                    selectedFiles: $selectedFiles,
                    viewMode: viewMode,
                    onDoubleClick: handleDoubleClick,
                    onContextMenu: { url in AnyView(handleContextMenu(url)) }
                )
            } else {
                Text("Select a folder from the sidebar")
                    .foregroundColor(.secondary)
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            }
        }
        .alert("Error", isPresented: $showingAlert) {
            Button("OK") { }
        } message: {
            Text(alertMessage)
        }
        .onDeleteCommand {
            deleteSelectedFiles()
        }
        .onCopyCommand {
            copySelectedFiles()
            return []
        }
        .onPasteCommand(of: [.fileURL]) { providers in
            pasteFiles(providers: providers)
        }
        .onAppear {
            loadRecentFiles()
        }
        .onChange(of: selectedURL) { newURL in
            if newURL == recentsURL {
                loadRecentFiles()
            }
        }
    }
    
    private var navigationBar: some View {
        HStack {
            // Back/Forward buttons
            HStack(spacing: 4) {
                Button(action: goBack) {
                    Image(systemName: "chevron.left")
                        .font(.system(size: 12, weight: .medium))
                }
                .disabled(!fileOperations.canGoBack)
                
                Button(action: goForward) {
                    Image(systemName: "chevron.right")
                        .font(.system(size: 12, weight: .medium))
                }
                .disabled(!fileOperations.canGoForward)
            }
            .buttonStyle(.borderless)
            
            // Path breadcrumb
            if let selectedURL = selectedURL {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 4) {
                        ForEach(pathComponents) { component in
                            Button(component.name) {
                                navigateToPath(component.url)
                            }
                            .buttonStyle(.borderless)
                            .foregroundColor(.primary)
                            
                            if component.url != selectedURL {
                                Image(systemName: "chevron.right")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                        }
                    }
                    .padding(.horizontal, 8)
                }
            }
            
            Spacer()
            
            // View options
            HStack(spacing: 8) {
                Picker("Sort by", selection: $sortBy) {
                    ForEach(SortOption.allCases, id: \.self) { option in
                        Text(option.rawValue).tag(option)
                    }
                }
                .pickerStyle(.menu)
                .frame(maxWidth: 120)
                
                Picker("View", selection: $viewMode) {
                    ForEach(ViewMode.allCases, id: \.self) { mode in
                        Label(mode.rawValue, systemImage: mode == .list ? "list.bullet" : "square.grid.2x2")
                            .tag(mode)
                    }
                }
                .pickerStyle(.segmented)
                .frame(maxWidth: 120)
            }
        }
        .padding(.horizontal)
        .padding(.vertical, 8)
        .background(Color(NSColor.controlBackgroundColor))
    }
    
    private var searchBar: some View {
        HStack {
            Image(systemName: "magnifyingglass")
                .foregroundColor(.secondary)
            
            TextField("Search", text: $searchText)
                .textFieldStyle(.plain)
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 6)
        .background(Color(NSColor.textBackgroundColor))
        .cornerRadius(8)
        .padding(.horizontal)
        .padding(.bottom, 8)
    }
    
    private var pathComponents: [PathComponent] {
        guard let selectedURL = selectedURL else { return [] }
        
        // Handle Recents special case
        if selectedURL == recentsURL {
            return [PathComponent(name: "Recents", url: recentsURL)]
        }
        
        var components: [PathComponent] = []
        var currentURL = selectedURL
        
        while currentURL.path != "/" {
            let name = currentURL.lastPathComponent.isEmpty ? currentURL.path : currentURL.lastPathComponent
            components.insert(PathComponent(name: name, url: currentURL), at: 0)
            currentURL = currentURL.deletingLastPathComponent()
        }
        
        // Add root
        components.insert(PathComponent(name: "🖥️", url: URL(fileURLWithPath: "/")), at: 0)
        
        return components
    }
    
    private func handleDoubleClick(_ url: URL) {
        var isDirectory: ObjCBool = false
        if FileManager.default.fileExists(atPath: url.path, isDirectory: &isDirectory) {
            if isDirectory.boolValue {
                // If we're in Recents and clicking a folder, navigate to that folder
                if selectedURL == recentsURL {
                    fileOperations.navigateToDirectory(url)
                    selectedURL = url
                } else {
                    fileOperations.navigateToDirectory(url)
                    selectedURL = url
                }
                selectedFiles.removeAll()
            } else {
                // Open file with default application
                NSWorkspace.shared.open(url)
                
                // If we're in Recents view and opening a file, optionally navigate to its parent directory
                // This mimics Finder behavior where opening a file from Recents can show its location
            }
        }
    }
    
    private func handleContextMenu(_ url: URL) -> some View {
        VStack {
            Button("Open") {
                handleDoubleClick(url)
            }
            
            Button("Show in Finder") {
                NSWorkspace.shared.selectFile(url.path, inFileViewerRootedAtPath: url.deletingLastPathComponent().path)
            }
            
            Divider()
            
            Button("Pin to Sidebar") {
                pinnedFoldersManager.addPinnedFolder(url)
            }
            .disabled(!fileOperations.isDirectory(url))
            
            Divider()
            
            Button("Copy") {
                copyFiles([url])
            }
            
            Button("Move to Trash") {
                deleteFiles([url])
            }
            
            Divider()
            
            Button("Get Info") {
                showFileInfo(url)
            }
        }
    }
    
    private func goBack() {
        if let previousURL = fileOperations.goBack() {
            selectedURL = previousURL
            selectedFiles.removeAll()
        }
    }
    
    private func goForward() {
        if let nextURL = fileOperations.goForward() {
            selectedURL = nextURL
            selectedFiles.removeAll()
        }
    }
    
    private func navigateToPath(_ url: URL) {
        fileOperations.navigateToDirectory(url)
        selectedURL = url
        selectedFiles.removeAll()
    }
    
    private func deleteSelectedFiles() {
        let filesToDelete = Array(selectedFiles)
        deleteFiles(filesToDelete)
    }
    
    private func deleteFiles(_ files: [URL]) {
        for file in files {
            do {
                try FileManager.default.trashItem(at: file, resultingItemURL: nil)
            } catch {
                alertMessage = "Failed to delete \(file.lastPathComponent): \(error.localizedDescription)"
                showingAlert = true
            }
        }
        selectedFiles.removeAll()
    }
    
    private func copySelectedFiles() {
        let filesToCopy = Array(selectedFiles)
        copyFiles(filesToCopy)
    }
    
    private func copyFiles(_ files: [URL]) {
        let pasteboard = NSPasteboard.general
        pasteboard.clearContents()
        pasteboard.writeObjects(files as [NSPasteboardWriting])
    }
    
    private func pasteFiles(providers: [NSItemProvider]) {
        guard let selectedURL = selectedURL else { return }
        
        for provider in providers {
            provider.loadItem(forTypeIdentifier: UTType.fileURL.identifier, options: nil) { (item, error) in
                if let data = item as? Data,
                   let sourceURL = URL(dataRepresentation: data, relativeTo: nil) {
                    
                    let destinationURL = selectedURL.appendingPathComponent(sourceURL.lastPathComponent)
                    
                    DispatchQueue.main.async {
                        do {
                            try FileManager.default.copyItem(at: sourceURL, to: destinationURL)
                        } catch {
                            self.alertMessage = "Failed to paste \(sourceURL.lastPathComponent): \(error.localizedDescription)"
                            self.showingAlert = true
                        }
                    }
                }
            }
        }
    }
    
    private func showFileInfo(_ url: URL) {
        // This could open a detailed info panel
        NSWorkspace.shared.open(url)
    }
    
    // Simple method to load recent files from common user directories
    private func loadRecentFiles() {
        DispatchQueue.global(qos: .background).async {
            var recentURLs: [URL] = []
            
            // Common user directories to scan
            let userDirectories = [
                URL(fileURLWithPath: NSHomeDirectory()).appendingPathComponent("Documents"),
                URL(fileURLWithPath: NSHomeDirectory()).appendingPathComponent("Desktop"),
                URL(fileURLWithPath: NSHomeDirectory()).appendingPathComponent("Downloads")
            ]
            
            let sevenDaysAgo = Date().addingTimeInterval(-7 * 24 * 60 * 60)
            
            for directory in userDirectories {
                if let enumerator = FileManager.default.enumerator(at: directory, includingPropertiesForKeys: [.contentModificationDateKey, .isRegularFileKey], options: [.skipsHiddenFiles, .skipsPackageDescendants]) {
                    
                    for case let fileURL as URL in enumerator {
                        do {
                            let resourceValues = try fileURL.resourceValues(forKeys: [.contentModificationDateKey, .isRegularFileKey])
                            
                            if let isRegularFile = resourceValues.isRegularFile,
                               let modificationDate = resourceValues.contentModificationDate,
                               isRegularFile && modificationDate > sevenDaysAgo {
                                recentURLs.append(fileURL)
                            }
                        } catch {
                            // Skip files that can't be accessed
                            continue
                        }
                    }
                }
            }
            
            // Sort by modification date (most recent first) and limit to 50 files
            let sortedRecents = recentURLs.sorted { url1, url2 in
                let date1 = (try? url1.resourceValues(forKeys: [.contentModificationDateKey]))?.contentModificationDate ?? Date.distantPast
                let date2 = (try? url2.resourceValues(forKeys: [.contentModificationDateKey]))?.contentModificationDate ?? Date.distantPast
                return date1 > date2
            }.prefix(50)
            
            DispatchQueue.main.async {
                self.recentFiles = Array(sortedRecents)
            }
        }
    }
} 