# Bird Copy Paste URLs Chrome Extension

A simple Chrome extension that allows you to copy all tab URLs from the current window or paste URLs from clipboard to open them in new tabs.

## Features

🦅 **Copy All Tab URLs**: Click "Copy" to copy all tab URLs from the current Chrome window to your clipboard
📋 **Paste URLs to Open**: Click "Paste" to read URLs from clipboard and open them in new tabs
🔗 **Smart URL Detection**: Automatically detects and validates URLs, adds https:// if needed
🚀 **Beautiful UI**: Modern gradient design with smooth animations
⚡ **Fast & Lightweight**: No external dependencies, instant operation

## Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `bird_copy_paste_urls` folder
5. The Bird extension icon will appear in your Chrome toolbar

## Usage

### Copy URLs
1. Click the Bird extension icon in Chrome toolbar
2. Click "Copy All Tab URLs"
3. All URLs from tabs in the current window are copied to clipboard

### Paste URLs
1. Copy some URLs to your clipboard (separated by newlines, spaces, or commas)
2. Click the Bird extension icon in Chrome toolbar
3. Click "Paste URLs to Open"
4. Each URL opens in a new tab (max 20 tabs for safety)

## Supported URL Formats

- `https://example.com`
- `http://example.com`  
- `example.com` (automatically adds https://)
- Multiple URLs separated by:
  - New lines
  - Spaces
  - Commas

## Permissions

- **tabs**: Access tab information to copy URLs and create new tabs
- **clipboardRead**: Read URLs from clipboard for paste function
- **clipboardWrite**: Write URLs to clipboard for copy function

## Files

- `manifest.json` - Extension configuration
- `popup.html` - Extension popup interface
- `popup.css` - Styling with modern gradients and animations
- `popup.js` - Main functionality for copy/paste operations
- `icons/` - SVG icons in multiple sizes
- `generate_icons.html` - Icon generator tool (open in browser to create custom icons)

## Technical Details

- **Manifest Version**: 3 (latest Chrome extension standard)
- **Permissions**: Minimal required permissions only
- **URL Validation**: Uses native URL constructor for validation
- **Safety Limits**: Max 20 tabs opened at once to prevent browser overload
- **Error Handling**: Graceful handling of clipboard errors and invalid URLs

## Customization

To customize the icon:
1. Open `generate_icons.html` in a browser
2. Right-click each canvas and save as PNG
3. Update manifest.json to use PNG files instead of SVG

## Browser Compatibility

- Chrome 88+ (Manifest V3 support)
- Chromium-based browsers (Edge, Brave, etc.)