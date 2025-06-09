import SwiftUI
import Foundation

extension URL: Identifiable {
    public var id: String { self.absoluteString }
}

struct FileListView: View {
    let files: [URL]
    @Binding var selectedFiles: Set<URL>
    let viewMode: FileManagerView.ViewMode
    let onDoubleClick: (URL) -> Void
    let onContextMenu: (URL) -> AnyView
    
    @State private var isColumnView: Bool = false
    @State private var showTarjnonSaves: Bool = false
    @State private var selectedTarjnonFolders: Set<String> = []
    @State private var showNelderCreator: Bool = false
    @StateObject private var borchinFolderManager = BorchinFolderManager()
    @State private var showTemplatechuk: Bool = false
    @State private var templatechukFolder: String? = nil
    
    // Convert between URL and URL.ID for Table selection
    private var selectedFileIDs: Binding<Set<String>> {
        Binding(
            get: { Set(selectedFiles.map { $0.absoluteString }) },
            set: { newIDs in
                selectedFiles = Set(files.filter { newIDs.contains($0.absoluteString) })
            }
        )
    }
    
    var body: some View {
        VStack {
            // Top bar with toggle and Tarjnon Saves button
            if !showNelderCreator {
                HStack {
                    Button(action: {
                        isColumnView.toggle()
                    }) {
                        Text(isColumnView ? "Switch to List View" : "Switch to Column View")
                    }
                    .padding()

                    Button(action: {
                        showTarjnonSaves.toggle()
                    }) {
                        Text("Tarjnon Saves")
                            .foregroundColor(showTarjnonSaves ? .white : .primary)
                            .padding()
                            .background(showTarjnonSaves ? Color.blue : Color.clear)
                            .cornerRadius(8)
                    }

                    Button(action: {
                        showNelderCreator.toggle()
                    }) {
                        Text("Nelder Creator")
                            .foregroundColor(showNelderCreator ? .white : .primary)
                            .padding()
                            .background(showNelderCreator ? Color.blue : Color.clear)
                            .cornerRadius(8)
                    }

                    Button(action: {
                        showTemplatechuk.toggle()
                    }) {
                        Text("Templatechuk")
                    }
                    .padding()

                    Spacer()
                }
            }

            // Conditional view rendering
            if showTemplatechuk {
                templatechukView
            } else if showNelderCreator {
                nelderCreatorView
            } else if showTarjnonSaves {
                tarjnonSavesView
            } else if isColumnView {
                columnView
            } else {
                if viewMode == .list {
                    listView
                } else {
                    iconView
                }
            }
        }
        .onAppear {
            NSEvent.addLocalMonitorForEvents(matching: .keyDown) { event in
                handleKeyEvent(event)
                return event
            }
            borchinFolderManager.loadBorchinFolder()
        }
    }
    
    private var listView: some View {
        Table(files, selection: selectedFileIDs) {
            TableColumn("Name") { file in
                FileRowView(
                    file: file,
                    isSelected: selectedFiles.contains(file),
                    onTap: {
                        // Normal click: Replace selection with just this file
                        selectedFiles = [file]
                    },
                    onCommandTap: {
                        // Command+Click: Toggle selection (add/remove from selection)
                        if selectedFiles.contains(file) {
                            selectedFiles.remove(file)
                        } else {
                            selectedFiles.insert(file)
                        }
                    },
                    onDoubleClick: onDoubleClick,
                    onContextMenu: onContextMenu
                )
            }
            .width(min: 200, ideal: 300)
            
            TableColumn("Date Modified") { file in
                Text(formatDate(getModificationDate(for: file)))
                    .foregroundColor(.secondary)
                    .font(.caption)
            }
            .width(120)
            
            TableColumn("Size") { file in
                Text(formatFileSize(getFileSize(for: file)))
                    .foregroundColor(.secondary)
                    .font(.caption)
            }
            .width(80)
            
            TableColumn("Kind") { file in
                Text(getFileType(for: file))
                    .foregroundColor(.secondary)
                    .font(.caption)
            }
            .width(100)
        }
        .tableStyle(.inset(alternatesRowBackgrounds: true))
    }
    
    private var iconView: some View {
        ScrollView {
            LazyVGrid(columns: Array(repeating: GridItem(.adaptive(minimum: 80, maximum: 120), spacing: 0), count: 1), spacing: 0) {
                ForEach(files, id: \.self) { file in
                    FileIconView(
                        file: file,
                        isSelected: selectedFiles.contains(file),
                        onTap: {
                            // Normal click: Replace selection with just this file
                            selectedFiles = [file]
                        },
                        onCommandTap: {
                            // Command+Click: Toggle selection (add/remove from selection)
                            if selectedFiles.contains(file) {
                                selectedFiles.remove(file)
                            } else {
                                selectedFiles.insert(file)
                            }
                        },
                        onDoubleClick: onDoubleClick,
                        onContextMenu: onContextMenu
                    )
                }
            }
        }
    }
    
    private var columnView: some View {
        // Placeholder for Column View implementation
        Text("Column View")
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .background(Color.gray.opacity(0.1))
    }
    
    private var tarjnonSavesView: some View {
        VStack {
            Button("Add new Tarjnon save folder") {
                addNewTarjnonFolder()
            }
            .padding()

            // Add Remove Folder from Tarjnon button
            Button(action: {
                removeSelectedTarjnonFolders()
            }) {
                Text("Remove Folder from Tarjnon")
            }
            .padding()

            // Add Designate Folder as Borchin button
            Button(action: {
                designateFolderAsBorchin()
            }) {
                Text("Designate Folder as Borchin")
            }
            .padding()

            // Display current Tarjnon folders with checkboxes
            VStack(alignment: .leading) {
                Text("Current Tarjnon Folders:").bold()
                ForEach(DatabaseManager.shared.getTarjnonFolders(), id: \ .self) { folder in
                    HStack {
                        Toggle(isOn: Binding(
                            get: { selectedTarjnonFolders.contains(folder) },
                            set: { isSelected in
                                if isSelected {
                                    selectedTarjnonFolders.insert(folder)
                                } else {
                                    selectedTarjnonFolders.remove(folder)
                                }
                            }
                        )) {
                            Text(folder)
                        }
                    }
                }
            }
            .padding()
        }
    }
    
    private func addNewTarjnonFolder() {
        let dialog = NSOpenPanel()
        dialog.title = "Choose a folder"
        dialog.canChooseDirectories = true
        dialog.canChooseFiles = false
        dialog.allowsMultipleSelection = false

        if dialog.runModal() == .OK, let url = dialog.url {
            // Save the selected folder to the database
            DatabaseManager.shared.addTarjnonFolder(path: url.path, name: url.lastPathComponent)
        }
    }
    
    private func removeSelectedTarjnonFolders() {
        for folder in selectedTarjnonFolders {
            // Implement the logic to remove the folder from the database
            // Example: DatabaseManager.shared.removeTarjnonFolder(path: folder)
        }
        selectedTarjnonFolders.removeAll()
    }
    
    private func designateFolderAsBorchin() {
        guard let selectedFolder = selectedTarjnonFolders.first else { return }
        borchinFolderManager.borchinFolder = selectedFolder
        // Store the borchinFolder setting
        UserDefaults.standard.set(selectedFolder, forKey: "borchinFolder")
        print("DEBUG: borchinFolder designated as: \(selectedFolder)")
    }
    
    private func getModificationDate(for url: URL) -> Date? {
        try? url.resourceValues(forKeys: [.contentModificationDateKey]).contentModificationDate
    }
    
    private func getFileSize(for url: URL) -> Int64 {
        if let size = try? url.resourceValues(forKeys: [.fileSizeKey]).fileSize {
            return Int64(size)
        }
        return 0
    }
    
    private func getFileType(for url: URL) -> String {
        var isDirectory: ObjCBool = false
        FileManager.default.fileExists(atPath: url.path, isDirectory: &isDirectory)
        
        if isDirectory.boolValue {
            return "Folder"
        } else {
            let pathExtension = url.pathExtension.lowercased()
            return pathExtension.isEmpty ? "File" : "\(pathExtension.uppercased()) File"
        }
    }
    
    private func formatDate(_ date: Date?) -> String {
        guard let date = date else { return "--" }
        let formatter = DateFormatter()
        formatter.dateStyle = .short
        formatter.timeStyle = .short
        return formatter.string(from: date)
    }
    
    private func formatFileSize(_ size: Int64) -> String {
        let formatter = ByteCountFormatter()
        formatter.allowedUnits = [.useKB, .useMB, .useGB, .useTB]
        formatter.countStyle = .file
        return formatter.string(fromByteCount: size)
    }

    // Add a function to handle key events.
    private func handleKeyEvent(_ event: NSEvent) {
        guard let characters = event.charactersIgnoringModifiers else { return }
        switch characters {
        case "\u{F700}": // Up arrow
            moveSelection(up: true)
        case "\u{F701}": // Down arrow
            moveSelection(up: false)
        default:
            break
        }
    }

    // Add a function to move the selection.
    private func moveSelection(up: Bool) {
        guard let currentIndex = files.firstIndex(where: { selectedFiles.contains($0) }) else { return }
        let newIndex = up ? max(currentIndex - 1, 0) : min(currentIndex + 1, files.count - 1)
        selectedFiles = [files[newIndex]]
    }

    private var nelderCreatorView: some View {
        VStack {
            if let borchinFolder = borchinFolderManager.borchinFolder {
                Text("Borchin Folder: \(borchinFolder)")
                    .padding()
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(Color.red.opacity(0.1))

                FileListView(
                    files: getFilesInDirectory(borchinFolder),
                    selectedFiles: $selectedFiles,
                    viewMode: viewMode,
                    onDoubleClick: { file in
                        if FileManager.default.fileExists(atPath: file.path, isDirectory: nil) {
                            // Navigate into the directory
                            borchinFolderManager.borchinFolder = file.path
                            print("DEBUG: Navigated into borchinFolder: \(borchinFolder ?? "None")")
                            UserDefaults.standard.set(borchinFolder, forKey: "borchinFolder")
                        } else {
                            onDoubleClick(file)
                        }
                    },
                    onContextMenu: onContextMenu
                )
            } else {
                Text("No Borchin Folder Selected")
                    .padding()
            }
        }
    }

    private func getFilesInDirectory(_ path: String) -> [URL] {
        let url = URL(fileURLWithPath: path)
        let fileManager = FileManager.default
        let files = (try? fileManager.contentsOfDirectory(at: url, includingPropertiesForKeys: nil)) ?? []
        return files
    }

    private var templatechukView: some View {
        VStack {
            Button("Select Templatechuk Folder") {
                selectTemplatechukFolder()
            }
            .padding()

            if let templatechukFolder = templatechukFolder {
                Text("Selected Folder: \(templatechukFolder)")
                    .padding()
            }

            Button("Save Templatechuk Folder") {
                saveTemplatechukFolder()
            }
            .padding()
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color.gray.opacity(0.1))
    }

    private func selectTemplatechukFolder() {
        let dialog = NSOpenPanel()
        dialog.title = "Choose a Templatechuk folder"
        dialog.canChooseDirectories = true
        dialog.canChooseFiles = false
        dialog.allowsMultipleSelection = false

        if dialog.runModal() == .OK, let url = dialog.url {
            templatechukFolder = url.path
        }
    }

    private func saveTemplatechukFolder() {
        guard let templatechukFolder = templatechukFolder else { return }
        // Store the templatechukFolder setting
        UserDefaults.standard.set(templatechukFolder, forKey: "templatechukFolder")
        print("Templatechuk folder designated: \(templatechukFolder)")
    }
}

struct FileRowView: View {
    let file: URL
    let isSelected: Bool
    let onTap: () -> Void
    let onCommandTap: () -> Void
    let onDoubleClick: (URL) -> Void
    let onContextMenu: (URL) -> AnyView
    
    @State private var isDirectory: Bool = false
    
    var body: some View {
        HStack(spacing: 8) {
            Image(systemName: getFileIcon())
                .foregroundColor(getFileColor())
                .frame(width: 16)
            
            Text(file.lastPathComponent)
                .lineLimit(1)
                .truncationMode(.middle)
                .foregroundColor(isSelected ? .white : .primary)
            
            Spacer()
        }
        .padding(.horizontal, 8)
        .frame(maxWidth: .infinity, minHeight: 24, alignment: .leading)
        .background(isSelected ? Color.accentColor : Color.clear)
        .contentShape(Rectangle())
        .onTapGesture(count: 2) {
            onDoubleClick(file)
        }
        .simultaneousGesture(
            TapGesture(count: 1)
                .modifiers(.command)
                .onEnded { _ in
                    onCommandTap()
                }
        )
        .simultaneousGesture(
            TapGesture(count: 1)
                .onEnded { _ in
                    onTap()
                }
        )
        .contextMenu {
            onContextMenu(file)
        }
        .onAppear {
            checkIfDirectory()
        }
    }
    
    private func checkIfDirectory() {
        var isDir: ObjCBool = false
        FileManager.default.fileExists(atPath: file.path, isDirectory: &isDir)
        isDirectory = isDir.boolValue
    }
    
    private func getFileIcon() -> String {
        if isDirectory {
            return "folder"
        }
        
        let pathExtension = file.pathExtension.lowercased()
        switch pathExtension {
        case "txt", "md", "rtf":
            return "doc.text"
        case "pdf":
            return "doc.text.fill"
        case "jpg", "jpeg", "png", "gif", "bmp", "tiff":
            return "photo"
        case "mov", "mp4", "avi", "mkv":
            return "video"
        case "mp3", "wav", "aac", "flac":
            return "music.note"
        case "zip", "rar", "7z", "tar", "gz":
            return "archivebox"
        case "app":
            return "app.gift"
        default:
            return "doc"
        }
    }
    
    private func getFileColor() -> Color {
        if isDirectory {
            return isSelected ? .white : .blue
        }
        
        let pathExtension = file.pathExtension.lowercased()
        let baseColor: Color
        switch pathExtension {
        case "jpg", "jpeg", "png", "gif", "bmp", "tiff":
            baseColor = .green
        case "mov", "mp4", "avi", "mkv":
            baseColor = .purple
        case "mp3", "wav", "aac", "flac":
            baseColor = .orange
        case "zip", "rar", "7z", "tar", "gz":
            baseColor = .brown
        case "app":
            baseColor = .blue
        default:
            baseColor = .primary
        }
        
        return isSelected ? .white : baseColor
    }
}

struct FileIconView: View {
    let file: URL
    let isSelected: Bool
    let onTap: () -> Void
    let onCommandTap: () -> Void
    let onDoubleClick: (URL) -> Void
    let onContextMenu: (URL) -> AnyView
    
    @State private var isDirectory: Bool = false
    
    var body: some View {
        VStack(spacing: 4) {
            Image(systemName: getFileIcon())
                .font(.system(size: 32))
                .foregroundColor(getFileColor())
                .frame(width: 48, height: 48)
            
            Text(file.lastPathComponent)
                .font(.caption)
                .lineLimit(2)
                .multilineTextAlignment(.center)
                .truncationMode(.middle)
        }
        .frame(width: 80, height: 80)
        .background(isSelected ? Color.accentColor.opacity(0.3) : Color.clear)
        .cornerRadius(8)
        .contentShape(Rectangle())
        .onTapGesture(count: 2) {
            onDoubleClick(file)
        }
        .simultaneousGesture(
            TapGesture(count: 1)
                .modifiers(.command)
                .onEnded { _ in
                    onCommandTap()
                }
        )
        .simultaneousGesture(
            TapGesture(count: 1)
                .onEnded { _ in
                    onTap()
                }
        )
        .contextMenu {
            onContextMenu(file)
        }
        .onAppear {
            checkIfDirectory()
        }
    }
    
    private func checkIfDirectory() {
        var isDir: ObjCBool = false
        FileManager.default.fileExists(atPath: file.path, isDirectory: &isDir)
        isDirectory = isDir.boolValue
    }
    
    private func getFileIcon() -> String {
        if isDirectory {
            return "folder.fill"
        }
        
        let pathExtension = file.pathExtension.lowercased()
        switch pathExtension {
        case "txt", "md", "rtf":
            return "doc.text.fill"
        case "pdf":
            return "doc.richtext.fill"
        case "jpg", "jpeg", "png", "gif", "bmp", "tiff":
            return "photo.fill"
        case "mov", "mp4", "avi", "mkv":
            return "video.fill"
        case "mp3", "wav", "aac", "flac":
            return "music.note"
        case "zip", "rar", "7z", "tar", "gz":
            return "archivebox.fill"
        case "app":
            return "app.gift.fill"
        default:
            return "doc.fill"
        }
    }
    
    private func getFileColor() -> Color {
        if isDirectory {
            return .blue
        }
        
        let pathExtension = file.pathExtension.lowercased()
        switch pathExtension {
        case "jpg", "jpeg", "png", "gif", "bmp", "tiff":
            return .green
        case "mov", "mp4", "avi", "mkv":
            return .purple
        case "mp3", "wav", "aac", "flac":
            return .orange
        case "zip", "rar", "7z", "tar", "gz":
            return .brown
        case "app":
            return .blue
        default:
            return .primary
        }
    }
} 
