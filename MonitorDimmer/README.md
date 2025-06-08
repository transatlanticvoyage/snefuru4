# MonitorDimmer

A macOS application that automatically dims monitors where the cursor is not currently active. Perfect for multi-monitor setups to help focus on the active display.

## Features

- **Automatic Monitor Detection**: Supports up to 16 monitors (easily handles 6+ monitor setups)
- **Real-time Cursor Tracking**: Tracks cursor position and dims inactive monitors in real-time
- **Status Bar Integration**: Lives in your menu bar with easy toggle controls
- **Dynamic Monitor Configuration**: Automatically adapts when monitors are added/removed
- **Lightweight**: Minimal system resource usage
- **No Admin Privileges Required**: Uses overlay windows instead of system brightness controls

## How It Works

The application:
1. Detects all connected monitors using Core Graphics APIs
2. Creates transparent black overlay windows for each monitor
3. Tracks cursor position every 100ms
4. Shows/hides overlays based on which monitor contains the cursor
5. Automatically updates when display configuration changes

## Building

### Prerequisites
- macOS 13.0 or later
- Xcode 15.0 or later
- Swift 5.0

### Build Steps
1. Open `MonitorDimmer.xcodeproj` in Xcode
2. Select your development team in the project settings
3. Build and run (⌘+R)

### Manual Build (Terminal)
```bash
cd MonitorDimmer
xcodebuild -project MonitorDimmer.xcodeproj -scheme MonitorDimmer -configuration Release
```

## Usage

1. Launch the application - it will appear in your menu bar with a display icon
2. The app automatically starts dimming inactive monitors
3. Right-click the menu bar icon to:
   - Toggle dimming on/off
   - Quit the application
4. Move your cursor between monitors to see the dimming effect

## Customization

You can modify the dimming intensity by changing the alpha value in `MonitorManager.swift`:

```swift
overlay.backgroundColor = NSColor.black.withAlphaComponent(0.6) // Change 0.6 to your preferred opacity
```

## Troubleshooting

### Overlays not appearing
- Check that the app has accessibility permissions in System Preferences > Security & Privacy > Privacy > Accessibility
- Ensure no other applications are interfering with window levels

### Performance issues
- The cursor tracking interval can be adjusted in the `startMonitoring()` method
- Current setting: 0.1 seconds (10 FPS)

### Multiple monitor issues
- The app supports up to 16 monitors by default
- For more monitors, increase `maxDisplays` in `detectMonitors()`

## System Requirements

- macOS 13.0+
- Multiple monitors (works with 1+ monitors)
- No special hardware requirements

## Privacy

This application:
- Does not collect any data
- Does not require internet access
- Only accesses cursor position and display information
- Runs entirely locally

## License

This project is provided as-is for educational and personal use. 