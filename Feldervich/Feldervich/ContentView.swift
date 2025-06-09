import SwiftUI

struct ContentView: View {
    @StateObject private var fileOperations = FileOperations()
    @StateObject private var pinnedFoldersManager = PinnedFoldersManager()
    @State private var selectedURL: URL?
    
    var body: some View {
        NavigationSplitView {
            SidebarView(
                pinnedFoldersManager: pinnedFoldersManager,
                selectedURL: $selectedURL
            )
            .navigationSplitViewColumnWidth(min: 200, ideal: 250, max: 300)
        } detail: {
            FileManagerView(
                fileOperations: fileOperations,
                pinnedFoldersManager: pinnedFoldersManager,
                selectedURL: $selectedURL
            )
        }
        .navigationSplitViewStyle(.balanced)
        .onAppear {
            // Set initial directory to user's home directory
            let homeURL = URL(fileURLWithPath: NSHomeDirectory())
            print("DEBUG ContentView: Setting initial selectedURL to: \(homeURL.path)")
            selectedURL = homeURL
            print("DEBUG ContentView: selectedURL is now: \(selectedURL?.path ?? "nil")")
        }
    }
}

#Preview {
    ContentView()
} 