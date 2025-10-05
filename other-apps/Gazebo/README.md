# Gazebo Finder Extension

A macOS Finder Extension that integrates with Pavilion to provide quick access to stream management directly from Finder's context menu.

## Setup Instructions

### 1. Create Xcode Project

1. Open Xcode
2. Create a new macOS App project:
   - Product Name: `Gazebo`
   - Bundle Identifier: `com.pavilion.gazebo` (or your preferred identifier)
   - Language: Swift
   - Use Core Data: No
   - Use CloudKit: No

### 2. Add Finder Extension Target

1. In Xcode, go to File → New → Target
2. Choose macOS → Finder Extension
3. Set:
   - Product Name: `GazeboFinderExtension`
   - Bundle Identifier: `com.pavilion.gazebo.extension`
   - Language: Swift

### 3. Replace Generated Files

Replace the generated `FinderSync.swift` file with the one created in this directory.

## Features

- **"Gazebo Options" Menu**: Appears in Finder right-click context menu
- **Submenu Support**: Ready for future stream actions
- **Universal Support**: Works on files, folders, and sidebar items

## Current Implementation

The extension currently shows:
- "Gazebo Options" main menu item
- Submenu with placeholder "Stream Actions (Coming Soon)"
- Alert dialog when clicked (for testing)

## Next Steps

1. Add specific stream actions (Add to Stream 1-10)
2. Implement communication with Pavilion app
3. Add visual indicators for items already in streams
4. Handle batch operations for multiple selected files

## Installation

1. Build the project in Xcode
2. Enable the extension in System Settings → Privacy & Security → Extensions → Finder Extensions
3. Restart Finder: `killall Finder`

## Testing

Right-click on any file or folder in Finder to see the "Gazebo Options" menu item.