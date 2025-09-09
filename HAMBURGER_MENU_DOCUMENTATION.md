# Hamburger Menu System Documentation

## System Overview
The Hamburger Menu is the primary navigation toggle button that controls the visibility of the sidebar navigation menu throughout the application. It's positioned as a fixed element in the top-left corner of every page and works in conjunction with the Layout System Provider.

## Core Architecture

### File Structure
```
app/components/
├── layout-systems/
│   ├── LayoutSystemProvider.tsx    # Main layout context provider
│   ├── LayoutSystemSwitcher.tsx    # System switching component
│   └── index.ts                    # Export barrel file
├── sidebars/
│   ├── Sidebar1.tsx               # Primary sidebar with hamburger button
│   ├── Sidebar2.tsx               # Secondary sidebar variant
│   ├── Sidebar3.tsx               # Tertiary sidebar variant
│   └── index.ts                   # Export barrel file
└── bezel-visibility-system/
    ├── BezelButton.tsx            # Positioned below hamburger menu
    └── ...
```

### Key Components

#### 1. LayoutSystemProvider.tsx
- **Purpose**: Central state management for layout system
- **Key State**:
  - `sidebarOpen` - Controls sidebar visibility 
  - `headerVisible` - Controls header visibility
  - `currentSystem` - Which layout system is active
- **Key Functions**:
  - `toggleSidebar()` - Toggles sidebar open/closed state
  - `handleHeaderVisibilityChange()` - Controls header visibility

#### 2. Sidebar Components (Sidebar1.tsx, Sidebar2.tsx, Sidebar3.tsx)
- **Purpose**: Contains both the sidebar content AND the hamburger toggle button
- **Key Features**:
  - Fixed position hamburger button at top-left
  - Conditional rendering of toggle button via `showToggleButton` prop
  - BezelButton positioned below hamburger button

## Hamburger Button Implementation

### Physical Location and Styling
```typescript
// In Sidebar1.tsx lines 419-428
<button
  onClick={onToggle}
  className="fixed z-40 p-2 rounded-md shadow-lg border border-gray-600 hover:bg-gray-700 transition-colors"
  style={{ top: '1px', left: '1px', backgroundColor: '#cecece' }}
  title="Toggle Navigation Menu"
>
  <svg className="h-5 w-5 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
</button>
```

### Position Specifications
- **Position**: `fixed` - Stays in same spot when scrolling
- **Location**: `top: 1px, left: 1px` - 1 pixel from browser edges
- **Z-index**: `z-40` - Above most content but below modals
- **Size**: `p-2` padding with `h-5 w-5` SVG icon (approximately 41px total)

### Visual Design
- **Background**: Light gray (`#cecece`) 
- **Border**: Gray border with rounded corners
- **Icon**: Three horizontal lines (classic hamburger pattern)
- **Hover Effect**: Darker gray background on hover
- **Transition**: Smooth color transition on hover

## Relationship with Bezel Button

### Positioning Coordination
```typescript
// BezelButton.tsx positioning
style={{ 
  top: '43px',     // Positioned below hamburger button
  left: '1px',     // Same left alignment
  width: '41px',   // Matches hamburger button width
}}
```

The Bezel Button is specifically positioned to sit directly below the hamburger menu:
- **Hamburger**: `top: 1px` (with padding makes it ~41px tall)
- **Bezel**: `top: 43px` (2px gap below hamburger)
- **Both**: `left: 1px` (same left alignment)

## Layout System Integration

### How It Works Across the Application

#### 1. Protected Layout Wrapper
```typescript
// app/(protected)/layout.tsx
export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <LayoutSystemProvider>  {/* Wraps all protected pages */}
        {children}
      </LayoutSystemProvider>
    </ProtectedRoute>
  );
}
```

#### 2. Layout System Provider
```typescript
// Key state and functions in LayoutSystemProvider.tsx
const [sidebarOpen, setSidebarOpen] = useState(false);

const toggleSidebar = () => {
  setSidebarOpen(!sidebarOpen);
};

// Context provides these to all child components
const value = {
  sidebarOpen,
  toggleSidebar,
  // ... other layout state
};
```

#### 3. Sidebar Component Integration
```typescript
// Sidebar receives toggle function as prop
interface SidebarMenuProps {
  isOpen: boolean;           // Current open state
  onToggle: () => void;      // Function to toggle state
  showToggleButton?: boolean; // Whether to show hamburger button
}

export default function SidebarMenu({ isOpen, onToggle, showToggleButton = true }: SidebarMenuProps) {
  // Hamburger button calls onToggle when clicked
  // Sidebar content shows/hides based on isOpen
}
```

## Multiple Layout Systems

### System Variants
The app supports multiple layout systems (Sidebar1, Sidebar2, Sidebar3), each with:
- **Same hamburger button implementation**
- **Same positioning and styling**
- **Different sidebar content and layouts**
- **User can switch between systems via preferences**

### User Permissions
```typescript
// User access control in LayoutSystemProvider
const permissions = {
  is_admin: data?.is_admin || false
};

// Different users see different layout options
const available = getAvailableLayoutSystems(permissions);
```

## Component Props and Configuration

### Sidebar Props
```typescript
interface SidebarMenuProps {
  isOpen: boolean;                    // Controls sidebar visibility
  onToggle: () => void;              // Hamburger click handler
  showToggleButton?: boolean;        // Hide hamburger if needed (default: true)
  onHeaderVisibilityChange: (visible: boolean) => void; // Header control
}
```

### Conditional Rendering
```typescript
{/* Toggle Button - only show if showToggleButton is true */}
{showToggleButton && (
  <button onClick={onToggle}>
    {/* Hamburger icon */}
  </button>
)}
```

## Usage Patterns

### Standard Implementation
Most pages automatically get the hamburger menu via the ProtectedLayout wrapper:
1. Page renders inside `<LayoutSystemProvider>`
2. Provider determines which sidebar system to use
3. Sidebar renders with hamburger button
4. User clicks hamburger → `toggleSidebar()` → sidebar opens/closes

### Custom Implementation  
Some pages might need custom control:
```typescript
// Can hide default hamburger and provide custom control
<SidebarComponent 
  isOpen={customSidebarState}
  onToggle={customToggleFunction}
  showToggleButton={false}  // Hide default hamburger
/>
```

## Mobile Responsiveness

### Overlay Behavior
```typescript
{/* Overlay for mobile */}
{isOpen && (
  <div className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
       onClick={onToggle}>  {/* Click overlay to close */}
  </div>
)}
```

- **Mobile**: Sidebar appears as overlay with dark background
- **Desktop**: Sidebar pushes content or appears alongside content
- **Responsive**: `lg:hidden` class controls mobile-specific overlay

## Key Benefits

1. **Consistent UX**: Same hamburger button appearance across all pages
2. **Global State**: Sidebar state managed centrally via context
3. **Flexible Systems**: Multiple layout systems with same interaction pattern
4. **Mobile-First**: Responsive design with overlay behavior
5. **Accessibility**: Proper ARIA labels and keyboard navigation
6. **Performance**: Efficient state management and conditional rendering

## Integration with Other Systems

### With Bezel System
- Bezel button positioned directly below hamburger
- Both use same left alignment (`left: 1px`)
- Visual consistency with similar styling

### With Header System
- Hamburger can control header visibility via `onHeaderVisibilityChange`
- Header and sidebar work together for complete navigation

### With Authentication
- Sidebar content changes based on user permissions
- Admin users see different navigation options
- Layout system preferences stored per user