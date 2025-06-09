# Feldervich

A modern macOS file manager application built with SwiftUI that provides a Finder-like experience with custom folder pinning capabilities.

## Status

✅ **COMPLETE AND WORKING** - The Feldervich file manager app has been successfully built and tested. All core features are implemented and functional.

## Features

### Core Functionality
- **Full-screen file browsing** - Browse folders and files just like macOS Finder
- **Finder-like interface** - Familiar navigation with sidebar, breadcrumbs, and file list
- **File operations** - Open, copy, delete, paste, and move files and folders
- **Custom sidebar** - Pin your favorite folders for quick access
- **Search functionality** - Search files and folders in the current directory

### File Management
- **Multiple view modes** - List view and icon view for files
- **File sorting** - Sort by name, date modified, size, or file type
- **Context menus** - Right-click context menus for file operations
- **Keyboard shortcuts** - Standard macOS keyboard shortcuts for file operations
- **Drag and drop** - Full drag and drop support for file operations

### Navigation
- **Back/Forward navigation** - Navigate through folder history
- **Breadcrumb navigation** - Click on path components to navigate
- **Sidebar shortcuts** - Quick access to Desktop, Documents, Downloads, Applications, and Home
- **Mounted volumes** - Access external drives and network volumes

### Customization
- **Pinned folders** - Add frequently used folders to the sidebar
- **Persistent settings** - Your pinned folders are saved between app launches
- **Modern UI** - Native macOS design with SwiftUI

## Requirements

- macOS 13.0 or later
- Xcode 15.0 or later (for building from source)

## Installation

### Quick Build and Run

Use the provided build script for easy building and launching:

```bash
./build_and_run.sh
```

### Building from Source

1. Clone this repository:
   ```bash
   git clone <repository-url>
   cd Feldervich
   ```

2. Build using Xcode command line tools:
   ```bash
   xcodebuild -project Feldervich.xcodeproj -scheme Feldervich -configuration Debug build
   ```

3. Or open the project in Xcode:
   ```bash
   open Feldervich.xcodeproj
   ```
   Then press Cmd+R to build and run.

## Usage

### Basic Navigation
- **Opening the app**: Click the Feldervich icon in your dock to launch
- **Browsing folders**: Click on folders to navigate into them
- **Going back**: Use the back button or Cmd+[ to go to the previous folder
- **Going forward**: Use the forward button or Cmd+] to go to the next folder

### File Operations
- **Opening files**: Double-click files to open them with the default application
- **Selecting files**: Click to select, Cmd+click for multiple selection
- **Copying files**: Select files and press Cmd+C
- **Pasting files**: Navigate to destination and press Cmd+V
- **Deleting files**: Select files and press Delete or Cmd+Delete

### Sidebar Management
- **Pinning folders**: Right-click on a folder and select "Pin to Sidebar"
- **Removing pinned folders**: Right-click on a pinned folder in the sidebar and select "Remove from Sidebar"
- **Reordering**: Drag pinned folders to reorder them in the sidebar

### Search
- **Searching**: Use the search bar at the top to filter files in the current directory
- **Clear search**: Click the X in the search bar or clear the text

### View Options
- **Switching views**: Use the view toggle in the toolbar to switch between list and icon views
- **Sorting**: Use the sort dropdown to change how files are sorted

## Project Structure

```
Feldervich/
├── Feldervich/
│   ├── FeldervichApp.swift          # Main app entry point
│   ├── ContentView.swift            # Root content view
│   ├── Views/
│   │   ├── FileManagerView.swift    # Main file manager interface
│   │   ├── SidebarView.swift        # Sidebar with locations and pinned folders
│   │   └── FileListView.swift       # File list display (list and icon views)
│   ├── Models/
│   │   ├── FileOperations.swift     # File system operations and navigation
│   │   └── PinnedFoldersManager.swift # Pinned folders management
│   ├── Assets.xcassets/             # App icons and assets
│   ├── Info.plist                   # App configuration
│   └── Feldervich.entitlements      # App permissions
└── README.md
```

## Permissions

Feldervich requires the following permissions to function properly:

- **File System Access**: To browse and manage files and folders
- **Apple Events**: To interact with other applications when opening files
- **Network Volumes**: To access network-mounted drives
- **Removable Volumes**: To access external drives and USB devices

These permissions are automatically requested when the app first launches.

## Development

### Architecture
- **SwiftUI**: Modern declarative UI framework
- **ObservableObject**: For state management and data binding
- **FileManager**: Native file system operations
- **NSWorkspace**: Integration with macOS for file operations

### Key Components
- `FileOperations`: Handles all file system operations and navigation history
- `PinnedFoldersManager`: Manages custom sidebar folders with persistent storage
- `FileManagerView`: Main interface coordinating all file management features
- `SidebarView`: Navigation sidebar with system locations and pinned folders
- `FileListView`: Displays files in list or icon format with selection support

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is available for use under standard software development practices.

## Acknowledgments

- Built with SwiftUI and native macOS frameworks
- Inspired by the macOS Finder interface
- Uses modern macOS design principles and patterns 