# FavaTani Popup System

A safe, feature-rich popup system for the Fava template that can be completely disabled without affecting the base template functionality.

## ⚠️ IMPORTANT: Modal Implementation Constraint

**FavaTani ONLY supports the `/nwjar1`-style modal design. No other popup styles are supported.**

This system provides:
- ✅ Dual header bars (uelbar37 & uelbar38) with database colors
- ✅ Full-screen layout (95vw x 95vh) 
- ✅ 7-tab navigation system (ptab1-ptab7)
- ✅ URL display with parameter highlighting
- ✅ Copy URL functionality
- ✅ Checkbox actions in header bars

❌ **NOT SUPPORTED:** Simple modals, centered popups, custom layouts, alternative designs

## Overview

FavaTani is designed with a **disable-first philosophy** - it can be safely turned off completely while preserving the exact original Fava template experience. This ensures that your base template remains stable and functional regardless of popup system status.

## Key Features

- **🔒 Safe Disable/Enable** - Complete system shutdown with zero interference
- **⚡ Feature Flags** - Granular control over individual components
- **🎛️ Preset Configurations** - Pre-built settings for common scenarios  
- **📝 URL Integration** - Deep linking and parameter sync
- **💾 State Persistence** - localStorage integration for user preferences
- **⌨️ Keyboard Shortcuts** - Configurable hotkeys
- **🎨 Color Theming** - Database-driven color schemes
- **📱 Responsive Modal** - Adaptive popup sizing

## Quick Start

### Basic Usage (Default Settings)

```tsx
import FavaPageMaster from '@/app/(protected2)/fava/components/favaPageMaster';

function MyPage() {
  return (
    <FavaPageMaster 
      pageTitle="My Page"
      // Tani is enabled by default with 'standard' preset
    >
      <div>Your page content here</div>
    </FavaPageMaster>
  );
}
```

### Completely Disabled

```tsx
<FavaPageMaster 
  pageTitle="My Page"
  taniEnabled={false}  // Completely disables Tani system
>
  <div>Pure Fava template - no popup functionality</div>
</FavaPageMaster>
```

### Custom Configuration

```tsx
<FavaPageMaster 
  pageTitle="My Page"
  taniPreset="minimal"  // Use minimal preset
  taniConfig={{
    button: { 
      text: "Tools",
      position: "top-right",
      hotkey: "t"
    }
  }}
  taniContent={
    <div>
      <h3>Custom Popup Content</h3>
      <p>Your custom tools and controls here</p>
    </div>
  }
>
  <div>Your page content</div>
</FavaPageMaster>
```

## Disable/Enable Strategies

### 1. Complete System Disable

**When to use:** You want pure Fava functionality with no popup system whatsoever.

```tsx
<FavaPageMaster taniEnabled={false} />
```

**Result:** Uses `PureFavaPageMaster` component - identical to original Fava template.

### 2. Preset-Based Control

**When to use:** You want quick configuration for common scenarios.

```tsx
// Available presets
<FavaPageMaster taniPreset="disabled" />   // Same as taniEnabled={false}
<FavaPageMaster taniPreset="minimal" />    // Button + popup only
<FavaPageMaster taniPreset="standard" />   // Recommended for most pages
<FavaPageMaster taniPreset="full" />       // All features enabled
```

### 3. Feature-Level Control

**When to use:** You need granular control over specific features.

```tsx
<FavaPageMaster 
  taniFlags={{
    enabled: true,
    components: {
      button: true,           // Show trigger button
      popup: true,           // Render popup
      urlSync: false,        // Disable URL parameters  
      localStorage: false,   // Disable state persistence
      keyboardShortcuts: false, // Disable hotkeys
      colorFetching: true    // Enable color themes
    },
    features: {
      autoOpen: false,       // Don't auto-open on load
      outsideClickClose: true, // Click outside to close
      escapeKeyClose: true,  // ESC key to close
      tabMemory: false       // Don't remember last tab
    }
  }}
/>
```

## Configuration Options

### FavaTaniFeatureFlags

Controls what parts of the system are active:

```typescript
interface FavaTaniFeatureFlags {
  enabled: boolean;                    // Master switch
  components: {
    button: boolean;                   // Show/hide trigger button
    popup: boolean;                    // Render popup component
    urlSync: boolean;                  // URL parameter sync
    localStorage: boolean;             // State persistence
    keyboardShortcuts: boolean;        // Hotkey listeners
    colorFetching: boolean;           // Database color queries
  };
  features: {
    autoOpen: boolean;                // Auto-open on page load
    outsideClickClose: boolean;       // Click outside to close
    escapeKeyClose: boolean;          // ESC key to close
    tabMemory: boolean;               // Remember last active tab
  };
  debugging: {
    consoleLogging: boolean;          // Debug console output
    performanceTracking: boolean;     // Performance metrics
  };
}
```

### FavaTaniConfig

Customizes popup appearance and behavior:

```typescript
interface FavaTaniConfig {
  id: string;                           // Unique identifier
  title?: string;                       // Popup title
  tabs: FavaTaniTab[];                  // Tab configuration
  headers?: FavaTaniHeader[];           // Header configuration
  button?: {
    text?: string;                      // Button text
    position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
    icon?: ReactNode;                   // Custom icon
    hotkey?: string;                    // Keyboard shortcut
  };
  urlConfig?: {
    popupParam?: string;                // URL param name (default: 'tanipop')
    tabParam?: string;                  // URL param name (default: 'tanitab')
    storageKey?: string;                // localStorage key prefix
  };
  modalConfig?: {
    maxWidth?: string;                  // CSS max-width
    maxHeight?: string;                 // CSS max-height
    backdrop?: boolean;                 // Show backdrop
    centered?: boolean;                 // Center on screen
  };
}
```

## Presets Reference

### `disabled`
- Complete system shutdown
- Identical to `taniEnabled={false}`

### `minimal`
- Button + popup only
- No URL sync, localStorage, or keyboard shortcuts
- Safe mode for sensitive pages

### `standard` (recommended)
- All components enabled
- Conservative feature settings
- Good for most use cases

### `full`
- Everything enabled
- Includes auto-debugging in development
- Maximum functionality

## URL Parameters

When `urlSync` is enabled, these parameters control popup state:

- `tanipop=open` - Opens the popup
- `tanitab=tani1` - Sets active tab (tani1-tani7)

Example: `/mypage?tanipop=open&tanitab=tani2`

## Emergency Disable

If the system malfunctions, you can emergency disable it:

```tsx
// Via context (if you have access to useFavaTani hook)
const tani = useFavaTani();
tani?.actions.emergencyDisable();

// Via props (immediate)
<FavaPageMaster taniEnabled={false} />
```

## Development vs Production

The system automatically adjusts behavior:

**Development:**
- More verbose logging
- Performance tracking enabled
- Debug features available

**Production:**
- Conservative defaults
- No auto-opening
- Minimal logging

## Best Practices

### 1. Start with Presets
Use `taniPreset` instead of manual configuration when possible:

```tsx
// Good
<FavaPageMaster taniPreset="standard" />

// Avoid unless you need specific control
<FavaPageMaster taniFlags={{ /* complex config */ }} />
```

### 2. Test Disabled State
Always verify your page works with Tani disabled:

```tsx
// Test both states
<FavaPageMaster taniEnabled={true} />   // Enhanced
<FavaPageMaster taniEnabled={false} />  // Pure Fava
```

### 3. Use Safe Hooks
When building custom components, use safe hooks:

```tsx
import { useFavaTaniSafe } from '@/path/to/hooks';

function MyComponent() {
  const tani = useFavaTaniSafe(); // Returns null when disabled
  
  if (!tani) {
    return <div>Fallback UI</div>;
  }
  
  return <div>Enhanced UI</div>;
}
```

### 4. Environment-Based Disabling
Disable on specific pages or environments:

```tsx
const isAdminPage = pathname.includes('/admin');
const shouldDisableTani = isAdminPage || process.env.DISABLE_TANI === 'true';

<FavaPageMaster taniEnabled={!shouldDisableTani} />
```

## Migration from FPopup1

If migrating from the old FPopup1 system:

1. **Disable FPopup1** first to avoid conflicts
2. **Enable FavaTani gradually** using presets
3. **Test thoroughly** with `taniEnabled={false}` to ensure fallbacks work
4. **Migrate content** to new tab structure

## Troubleshooting

### Popup Not Appearing
1. Check `taniEnabled={true}`
2. Verify `taniFlags.enabled === true`
3. Ensure `taniFlags.components.button === true`
4. Check browser console for errors

### Button Not Showing
1. Verify `taniFlags.components.button === true`
2. Check CSS z-index conflicts
3. Ensure button position is not off-screen

### URL Parameters Not Working
1. Confirm `taniFlags.components.urlSync === true`
2. Check URL parameter names match config
3. Verify browser supports URLSearchParams

### Performance Issues
1. Disable unused features in `taniFlags.components`
2. Use `minimal` preset for basic functionality
3. Disable debugging in production

### Emergency Recovery
If the system breaks your page:

1. **Immediate fix:** Set `taniEnabled={false}`
2. **Temporary fix:** Use `taniPreset="minimal"`
3. **Debug mode:** Enable `taniFlags.debugging.consoleLogging`

## Advanced Usage

### Custom Conditional Components

```tsx
import { FavaTaniConditional } from '@/path/to/conditionalComponents';

function MyEnhancedComponent() {
  return (
    <div>
      <div>Always visible content</div>
      
      <FavaTaniConditional fallback={<div>Basic mode</div>}>
        <div>Enhanced mode with Tani features</div>
      </FavaTaniConditional>
    </div>
  );
}
```

### Safe Event Listeners

```tsx
import { useFavaTaniSafeEventListener } from '@/path/to/hooks';

function MyComponent() {
  useFavaTaniSafeEventListener('keydown', (e) => {
    // Only runs when Tani is enabled
    console.log('Key pressed:', e.key);
  });
  
  return <div>Component with safe listeners</div>;
}
```

### Direct Provider Usage

```tsx
import FavaTaniConditionalProvider from '@/path/to/provider';

function MyCustomLayout() {
  return (
    <FavaTaniConditionalProvider 
      config={{ id: 'custom', title: 'My Tools' }}
      flags={{ enabled: true }}
    >
      {/* Your content */}
    </FavaTaniConditionalProvider>
  );
}
```

## File Structure

```
app/(protected2)/fava/
├── components/
│   ├── favaPageMaster.tsx           # Main integrated component
│   ├── pureFavaPageMaster.tsx       # Pure Fava fallback
│   └── favaTaniPopup/
│       ├── types.ts                 # TypeScript interfaces
│       ├── favaTaniConditionalProvider.tsx
│       └── favaTaniConditionalComponents.tsx
├── config/
│   └── favaTaniFeatureFlags.ts      # Feature flag definitions
└── hooks/
    └── useFavaTaniSafeListeners.ts  # Safe hook utilities
```

## Support

For issues or questions:

1. Check this README first
2. Verify your configuration against examples
3. Test with `taniEnabled={false}` to isolate issues
4. Enable debug logging in development mode

Remember: **When in doubt, disable it.** The system is designed to fail safely back to pure Fava functionality.