#!/bin/bash

# Create Filegun Handler macOS App
echo "Creating Filegun Handler macOS app..."

# Create app structure
mkdir -p "Filegun Handler.app/Contents/MacOS"
mkdir -p "Filegun Handler.app/Contents/Resources"

# Create Info.plist
cat > "Filegun Handler.app/Contents/Info.plist" << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleExecutable</key>
    <string>filegun-handler</string>
    <key>CFBundleIdentifier</key>
    <string>com.snefuru.filegun-handler</string>
    <key>CFBundleName</key>
    <string>Filegun Handler</string>
    <key>CFBundleDisplayName</key>
    <string>Filegun Handler</string>
    <key>CFBundleVersion</key>
    <string>1.0</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>LSMinimumSystemVersion</key>
    <string>10.12</string>
    <key>LSUIElement</key>
    <true/>
    <key>CFBundleURLTypes</key>
    <array>
        <dict>
            <key>CFBundleURLName</key>
            <string>Filegun Handler</string>
            <key>CFBundleURLSchemes</key>
            <array>
                <string>filegun</string>
            </array>
        </dict>
    </array>
</dict>
</plist>
EOF

# Create the handler script
cat > "Filegun Handler.app/Contents/MacOS/filegun-handler" << 'EOF'
#!/usr/bin/env python3
import sys
import urllib.parse
import subprocess
import os

def main():
    if len(sys.argv) < 2:
        return
    
    # Get the URL
    url = sys.argv[1]
    
    # Parse the URL (filegun://open?path=/path/to/file)
    parsed = urllib.parse.urlparse(url)
    
    if parsed.scheme != 'filegun':
        return
    
    # Get query parameters
    params = urllib.parse.parse_qs(parsed.query)
    
    if parsed.netloc == 'open' and 'path' in params:
        file_path = params['path'][0]
        
        # Check if file exists
        if os.path.exists(file_path):
            if os.path.isdir(file_path):
                # Open folder in Finder
                subprocess.run(['open', file_path])
            else:
                # Reveal file in Finder
                subprocess.run(['open', '-R', file_path])
    
    elif parsed.netloc == 'vscode' and 'path' in params:
        file_path = params['path'][0]
        # Open in VS Code
        subprocess.run(['code', file_path])

if __name__ == '__main__':
    main()
EOF

# Make the script executable
chmod +x "Filegun Handler.app/Contents/MacOS/filegun-handler"

echo "✅ Filegun Handler.app created!"
echo ""
echo "To install:"
echo "1. Move 'Filegun Handler.app' to /Applications/"
echo "2. Double-click it once to register the URL handler"
echo "3. You may need to allow it in System Preferences > Security & Privacy"
echo ""
echo "Test it with: open 'filegun://open?path=/Users'"