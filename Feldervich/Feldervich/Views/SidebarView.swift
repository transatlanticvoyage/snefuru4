import SwiftUI

struct SidebarView: View {
    @ObservedObject var pinnedFoldersManager: PinnedFoldersManager
    @Binding var selectedURL: URL?
    
    private let systemLocations: [(name: String, url: URL, icon: String)] = [
        ("Desktop", URL(fileURLWithPath: NSHomeDirectory()).appendingPathComponent("Desktop"), "desktopcomputer"),
        ("Documents", URL(fileURLWithPath: NSHomeDirectory()).appendingPathComponent("Documents"), "doc.text"),
        ("Downloads", URL(fileURLWithPath: NSHomeDirectory()).appendingPathComponent("Downloads"), "arrow.down.circle"),
        ("Applications", URL(fileURLWithPath: "/Applications"), "app.gift"),
        ("Home", URL(fileURLWithPath: NSHomeDirectory()), "house")
    ]
    
    var body: some View {
        List(selection: $selectedURL) {
            Section("Favorites") {
                ForEach(systemLocations, id: \.url) { location in
                    SidebarItem(
                        name: location.name,
                        icon: location.icon,
                        url: location.url
                    )
                    .tag(location.url)
                }
            }
            
            Section("Pinned Folders") {
                ForEach(pinnedFoldersManager.pinnedFolders, id: \.self) { folder in
                    SidebarItem(
                        name: folder.lastPathComponent,
                        icon: "folder",
                        url: folder
                    )
                    .tag(folder)
                    .contextMenu {
                        Button("Remove from Sidebar") {
                            pinnedFoldersManager.removePinnedFolder(folder)
                        }
                        
                        Button("Show in Finder") {
                            NSWorkspace.shared.selectFile(folder.path, inFileViewerRootedAtPath: folder.deletingLastPathComponent().path)
                        }
                    }
                }
                .onDelete { indexSet in
                    for index in indexSet {
                        let folder = pinnedFoldersManager.pinnedFolders[index]
                        pinnedFoldersManager.removePinnedFolder(folder)
                    }
                }
            }
            
            Section("Devices") {
                // Add mounted volumes
                ForEach(getMountedVolumes(), id: \.self) { volume in
                    SidebarItem(
                        name: volume.lastPathComponent,
                        icon: getVolumeIcon(for: volume),
                        url: volume
                    )
                    .tag(volume)
                }
            }
        }
        .listStyle(.sidebar)
        .navigationTitle("Feldervich")
    }
    
    private func getMountedVolumes() -> [URL] {
        let volumeURLs = FileManager.default.mountedVolumeURLs(includingResourceValuesForKeys: [.volumeNameKey], options: .skipHiddenVolumes) ?? []
        return volumeURLs.filter { url in
            // Filter out system volumes and hidden volumes
            guard let volumeName = try? url.resourceValues(forKeys: [.volumeNameKey]).volumeName else { return false }
            return !volumeName.hasPrefix(".") && volumeName != "Macintosh HD"
        }
    }
    
    private func getVolumeIcon(for volume: URL) -> String {
        // Determine icon based on volume type
        if volume.path.contains("USB") || volume.path.contains("External") {
            return "externaldrive"
        } else if volume.path.contains("Network") {
            return "network"
        } else {
            return "internaldrive"
        }
    }
}

struct SidebarItem: View {
    let name: String
    let icon: String
    let url: URL
    
    var body: some View {
        HStack(spacing: 8) {
            Image(systemName: icon)
                .foregroundColor(.secondary)
                .frame(width: 16)
            
            Text(name)
                .lineLimit(1)
                .truncationMode(.tail)
            
            Spacer()
        }
        .padding(.vertical, 2)
        .contentShape(Rectangle())
    }
}

#Preview {
    NavigationSplitView {
        SidebarView(
            pinnedFoldersManager: PinnedFoldersManager(),
            selectedURL: .constant(nil)
        )
    } detail: {
        Text("Detail View")
    }
} 