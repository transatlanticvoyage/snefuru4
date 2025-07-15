export interface FavaTaniFeatureFlags {
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

export const FAVA_TANI_DEFAULT_FLAGS: FavaTaniFeatureFlags = {
  enabled: true,
  components: {
    button: true,
    popup: true,
    urlSync: true,
    localStorage: true,
    keyboardShortcuts: true,
    colorFetching: true
  },
  features: {
    autoOpen: false,
    outsideClickClose: true,
    escapeKeyClose: true,
    tabMemory: true
  },
  debugging: {
    consoleLogging: false,
    performanceTracking: false
  }
};

// Environment-based defaults
export function getFavaTaniDefaultFlags(): FavaTaniFeatureFlags {
  // Development mode - more features enabled
  if (process.env.NODE_ENV === 'development') {
    return {
      ...FAVA_TANI_DEFAULT_FLAGS,
      debugging: {
        consoleLogging: true,
        performanceTracking: true
      }
    };
  }
  
  // Production mode - conservative defaults
  return {
    ...FAVA_TANI_DEFAULT_FLAGS,
    features: {
      ...FAVA_TANI_DEFAULT_FLAGS.features,
      autoOpen: false,  // Never auto-open in production
    },
    debugging: {
      consoleLogging: false,
      performanceTracking: false
    }
  };
}

// Preset configurations for common scenarios
export const FAVA_TANI_PRESETS = {
  // Completely disabled
  disabled: {
    ...FAVA_TANI_DEFAULT_FLAGS,
    enabled: false
  },
  
  // Minimal safe mode - popup only, no listeners
  minimal: {
    ...FAVA_TANI_DEFAULT_FLAGS,
    components: {
      button: true,
      popup: true,
      urlSync: false,
      localStorage: false,
      keyboardShortcuts: false,
      colorFetching: false
    },
    features: {
      autoOpen: false,
      outsideClickClose: false,
      escapeKeyClose: false,
      tabMemory: false
    }
  },
  
  // Standard mode - recommended for most pages
  standard: {
    ...FAVA_TANI_DEFAULT_FLAGS,
    components: {
      button: true,
      popup: true,
      urlSync: true,
      localStorage: true,
      keyboardShortcuts: true,
      colorFetching: true
    }
  },
  
  // Full featured mode - all features enabled
  full: {
    ...FAVA_TANI_DEFAULT_FLAGS,
    features: {
      autoOpen: false,
      outsideClickClose: true,
      escapeKeyClose: true,
      tabMemory: true
    },
    debugging: {
      consoleLogging: process.env.NODE_ENV === 'development',
      performanceTracking: process.env.NODE_ENV === 'development'
    }
  }
};