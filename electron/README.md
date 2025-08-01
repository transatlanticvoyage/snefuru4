# FileGun Desktop Development

## Quick Start (Development)

1. **Install Electron dependencies:**
   ```bash
   cd electron
   npm install
   ```

2. **Run your Next.js dev server (in main directory):**
   ```bash
   npm run dev
   ```

3. **Start Electron (in electron directory):**
   ```bash
   NODE_ENV=development npm start
   ```

## Building for Production

1. **Build Next.js static export:**
   ```bash
   npm run build
   npm run export  # Creates 'out' directory
   ```

2. **Build Electron app:**
   ```bash
   cd electron
   npm run build
   ```

   This creates:
   - macOS: `dist/FileGun-1.0.0.dmg`
   - Windows: `dist/FileGun Setup 1.0.0.exe`
   - Linux: `dist/FileGun-1.0.0.AppImage`

## Code Changes Required

1. **Update your API calls to detect Electron:**
   ```typescript
   // In your components
   import { getFilegunBridge as getWebBridge } from '@/app/utils/filegun/websocketBridge';
   import { getFilegunBridge as getElectronBridge, isElectron } from '@/app/utils/filegun/electronBridge';
   
   const bridge = isElectron() ? getElectronBridge() : getWebBridge();
   ```

2. **Update file operations to use Electron APIs when available**

## Benefits of This Approach

- ✅ Same codebase for web and desktop
- ✅ No new languages or frameworks
- ✅ Full file system access in desktop mode
- ✅ Native file opening with system apps
- ✅ Can still run web version for development
- ✅ Easy distribution to customers

## Testing Desktop Features

The desktop version provides:
- Full file system access (no browser restrictions)
- Native file associations
- System tray integration (optional)
- Auto-updater support
- Offline functionality

## Licensing/SaaS Integration

Add to main.js:
```javascript
// Check license on startup
const checkLicense = async () => {
  const licenseKey = await store.get('licenseKey');
  if (!licenseKey) {
    // Show license input dialog
  }
  // Validate with your server
};
```