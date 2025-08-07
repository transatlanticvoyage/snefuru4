# Shatenzi Port Switcher

A Chrome extension for quickly switching between localhost development ports (3000, 3001, 3002).

## Features

- **Quick Port Switching**: Click to switch the current tab to a different port
- **Visual Indicator**: The currently active port is highlighted with a light yellow background
- **New Tab Support**: Ctrl+Click (or Cmd+Click on Mac) to open in a new tab
- **Smart URL Handling**: Preserves the full URL path when switching ports
- **Clean UI**: Bright blue icon with "PO" text for easy identification

## Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right corner
3. Click "Load unpacked"
4. Navigate to this folder: `/chrome-extensions/shatenzi_port_switcher/`
5. Select the folder and click "Open"

The extension icon (blue square with "PO") will appear in your Chrome toolbar.

## Usage

1. Click the extension icon to open the port switcher dropdown
2. The currently active port (if on localhost) will be highlighted in yellow
3. Click any port number to switch to that port
4. Hold Ctrl (or Cmd on Mac) while clicking to open in a new tab

## Supported URLs

The extension works with:
- `http://localhost:3000/...`
- `http://127.0.0.1:3000/...`
- `http://192.168.x.x:3000/...`

## Files

- `manifest.json` - Chrome extension configuration
- `popup.html` - Extension popup UI structure
- `popup.css` - Styling for the popup
- `popup.js` - Port switching logic
- `icons/` - Extension icons (SVG format)

## Development

To modify the extension:
1. Edit the relevant files
2. Go to `chrome://extensions/`
3. Click the refresh icon on the extension card
4. Test your changes

## Icon Generation

Icons are generated as SVG files. To regenerate:
```bash
node generate_icons.js
```

## Version History

- **1.0.0** - Initial release with port switching for 3000, 3001, 3002