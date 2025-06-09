import SwiftUI

extension URL: @retroactive Identifiable {
    public var id: String { self.absoluteString }
}

struct FileListView: View {
    let files: [URL]
    @Binding var selectedFiles: Set<URL>
    let viewMode: FileManagerView.ViewMode
    let onDoubleClick: (URL) -> Void
    let onContextMenu: (URL) -> AnyView
    
    // Convert between URL and URL.ID for Table selection
    private var selectedFileIDs: Binding<Set<String>> {
        Binding(
            get: { Set(selectedFiles.map { $0.id }) },
            set: { newIDs in
                selectedFiles = Set(files.filter { newIDs.contains($0.id) })
            }
        )
    }
    
    var body: some View {
        print("DEBUG FileListView: Rendering with \(files.count) files")
        return Group {
            if viewMode == .list {
                listView
            } else {
                iconView
            }
        }
    }
    
    private var listView: some View {
        Table(files, selection: selectedFileIDs) {
            TableColumn("Name") { file in
                FileRowView(
                    file: file,
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
            LazyVGrid(columns: Array(repeating: GridItem(.adaptive(minimum: 80, maximum: 120), spacing: 16), count: 1), spacing: 16) {
                ForEach(files, id: \.self) { file in
                    FileIconView(
                        file: file,
                        isSelected: selectedFiles.contains(file),
                        onTap: {
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
            .padding()
        }
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
}

struct FileRowView: View {
    let file: URL
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
            
            Spacer()
        }
        .contentShape(Rectangle())
        .onTapGesture(count: 2) {
            onDoubleClick(file)
        }
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

struct FileIconView: View {
    let file: URL
    let isSelected: Bool
    let onTap: () -> Void
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
        .onTapGesture {
            onTap()
        }
        .onTapGesture(count: 2) {
            onDoubleClick(file)
        }
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