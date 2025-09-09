# Bezel Visibility System Documentation

## System Overview
The Bezel System is a global popup-based configuration system that allows users to control the visibility of UI components on different pages throughout the application. It provides a consistent interface for toggling page-specific elements on/off with persistent localStorage settings.

## Core Architecture

### File Structure
```
app/components/bezel-visibility-system/
├── BezelButton.tsx          # Fixed position button that opens the popup
├── BezelPopup.tsx           # Main popup with page-specific configurations  
└── index.ts                 # Export barrel file
```

### Key Components

#### 1. BezelButton.tsx
- **Location**: Fixed position button at `top: 43px, left: 1px`
- **Purpose**: Triggers the bezel popup when clicked
- **Styling**: Gray button with "bezel" text, positioned below hamburger menu
- **Props**: `showButton` (optional) to control visibility

#### 2. BezelPopup.tsx  
- **Location**: Full-screen modal overlay
- **Purpose**: Contains all page-specific toggle configurations
- **Key Features**:
  - Page detection via `usePathname()` hook
  - Per-page configuration sections
  - localStorage persistence
  - Custom event dispatching for component communication

## Page Configuration System

### How to Add a New Page Config

#### Step 1: Add Page to Configuration Array
```typescript
// In BezelPopup.tsx line ~23
const pagesWithConfig = ['/sitejar4', '/bin34/tebnar2'];
```

#### Step 2: Add State Variables for Toggles
```typescript
// Example from BezelPopup.tsx
const [medievalChamberVisible, setMedievalChamberVisible] = useState(false);
const [folateChamberVisible, setFolateChamberVisible] = useState(false);
```

#### Step 3: Add localStorage Initialization
```typescript
// Initialize from localStorage with default values
useEffect(() => {
  if (pathname === '/bin34/tebnar2') {
    const savedVisibility = localStorage.getItem('tebnar2_medievalChamberVisible');
    if (savedVisibility !== null) {
      setMedievalChamberVisible(JSON.parse(savedVisibility));
    } else {
      // Default to false (hidden) and save it
      setMedievalChamberVisible(false);
      localStorage.setItem('tebnar2_medievalChamberVisible', JSON.stringify(false));
    }
  }
}, [pathname]);
```

#### Step 4: Add Toggle Handler Functions
```typescript
// Handle toggle change and dispatch events
const handleMedievalChamberToggle = (checked: boolean) => {
  setMedievalChamberVisible(checked);
  localStorage.setItem('tebnar2_medievalChamberVisible', JSON.stringify(checked));
  
  // Dispatch custom event to notify target components
  window.dispatchEvent(new CustomEvent('medievalChamberVisibilityChange', { 
    detail: { visible: checked } 
  }));
};
```

#### Step 5: Add UI Controls in Popup Content
```typescript
{/* /bin34/tebnar2 page specific controls */}
{pathname === '/bin34/tebnar2' && (
  <div className="space-y-6">
    <div className="bg-gray-50 p-4 rounded-lg border">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">Page Visibility Controls</h3>
      
      {/* Medieval Chamber Toggle */}
      <div className="flex items-center space-x-4">
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={medievalChamberVisible}
            onChange={(e) => handleMedievalChamberToggle(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
        <div className="font-bold text-black" style={{ fontSize: '16px' }}>
          medieval_chamber
        </div>
      </div>
    </div>
  </div>
)}
```

## Target Component Integration

### How Target Components Listen for Bezel Changes

#### Step 1: Add Visibility State to Target Component
```typescript
// In target page component (e.g., Tebnar2Main.tsx)
const [tbn2_medievalChamberVisible, setTbn2MedievalChamberVisible] = useState(false);
```

#### Step 2: Add Event Listener useEffect
```typescript
useEffect(() => {
  // Initialize from localStorage
  const savedVisibility = localStorage.getItem('tebnar2_medievalChamberVisible');
  if (savedVisibility !== null) {
    setTbn2MedievalChamberVisible(JSON.parse(savedVisibility));
  } else {
    setTbn2MedievalChamberVisible(false);
    localStorage.setItem('tebnar2_medievalChamberVisible', JSON.stringify(false));
  }

  // Listen for bezel events
  const handleMedievalChamberVisibilityChange = (event: CustomEvent) => {
    const { visible } = event.detail;
    setTbn2MedievalChamberVisible(visible);
  };

  window.addEventListener('medievalChamberVisibilityChange', handleMedievalChamberVisibilityChange as EventListener);
  
  return () => {
    window.removeEventListener('medievalChamberVisibilityChange', handleMedievalChamberVisibilityChange as EventListener);
  };
}, []);
```

#### Step 3: Apply Conditional Visibility to Target Elements
```typescript
{/* Apply hidden class based on state */}
<div className={`mb-6 p-4 border border-black bg-white medieval_chamber_div ${tbn2_medievalChamberVisible ? '' : 'hidden'}`}>
  {/* Component content */}
</div>
```

## Naming Conventions

### localStorage Keys
- Format: `{pagename}_{componentname}Visible`
- Examples: 
  - `sitejar4_blofferChamberVisible`
  - `tebnar2_medievalChamberVisible`

### Custom Events
- Format: `{componentname}VisibilityChange`
- Examples:
  - `medievalChamberVisibilityChange`
  - `blofferChamberVisibilityChange`

### CSS Classes
- Format: `{componentname}_div`
- Examples:
  - `medieval_chamber_div`
  - `bloffer_chamber_div`

## Current Page Configurations

### /sitejar4
- **Components**: 
  - `bloffer_chamber_div` (default: hidden)
  - `copper_chamber_div` (default: visible)
- **localStorage Keys**:
  - `sitejar4_blofferChamberVisible`
  - `sitejar4_copperChamberVisible`

### /bin34/tebnar2
- **Components**:
  - `medieval_chamber` (default: hidden)
  - `folate_chamber` (default: hidden, not yet implemented)
- **localStorage Keys**:
  - `tebnar2_medievalChamberVisible`  
  - `tebnar2_folateChamberVisible`

## How the System Works

1. **BezelButton** renders on every page at fixed position
2. User clicks button → **BezelPopup** opens as modal overlay
3. **BezelPopup** detects current page via `usePathname()`
4. If page is in `pagesWithConfig` array → shows page-specific controls
5. User toggles switches → changes saved to localStorage + custom events dispatched
6. Target components listen for custom events → update their visibility state
7. UI elements show/hide based on state using conditional CSS classes

## Benefits
- **Consistent UX**: Same bezel interface across all pages
- **Persistent Settings**: localStorage ensures settings survive page reloads
- **Decoupled Architecture**: Bezel system and target components communicate via events
- **Scalable**: Easy to add new pages and controls following established patterns