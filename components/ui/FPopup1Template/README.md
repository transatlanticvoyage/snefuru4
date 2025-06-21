# FPopup1Template System

A reusable popup template system extracted from the /nwjar1 functions popup implementation.

## Features

- **Modal popup with dual header bars**
- **7-tab navigation system with URL persistence**
- **Database-driven color customization**
- **Deep linking support**
- **localStorage integration for tab persistence**
- **Mutually exclusive checkbox actions**
- **Real-time URL tracking**

## Basic Usage

```typescript
import { FPopup1TemplateProvider, FPopup1Config } from '@/components/ui/FPopup1Template';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

const MyComponent = () => {
  const supabase = createClientComponentClient();
  
  const config: FPopup1Config = {
    id: "my-functions-popup",
    headers: [
      {
        type: 'url-display',
        label: 'BROWSER URL',
        colorScheme: 'uelbar37'
      },
      {
        type: 'pathname-actions',
        label: 'uelbar38',
        colorScheme: 'uelbar38',
        actions: [
          {
            type: 'checkbox',
            id: 'kz101',
            label: 'Use Your Current Selection From Table',
            checked: kz101Checked,
            onClick: handleKz101Click
          },
          {
            type: 'checkbox',
            id: 'kz103',
            label: 'Select All Items In Current Pagination',
            checked: kz103Checked,
            onClick: handleKz103Click
          }
        ]
      }
    ],
    tabs: [
      { id: 'ptab1', label: 'ptab1' },
      { id: 'ptab2', label: 'ptab2' },
      { id: 'ptab3', label: 'ptab3' },
      { id: 'ptab4', label: 'ptab4' },
      { id: 'ptab5', label: 'ptab5' },
      { id: 'ptab6', label: 'ptab6' },
      { id: 'ptab7', label: 'ptab7' }
    ],
    urlConfig: {
      popupParam: 'fpop',
      tabPrefix: 'ptab',
      storageKey: 'my_popup_lastActiveTab'
    }
  };

  return (
    <div>
      <button onClick={handlePopupOpen}>
        Open Functions Popup
      </button>
      
      <FPopup1TemplateProvider config={config} supabase={supabase}>
        {/* Custom tab content goes here */}
        <div>Your custom content for each tab</div>
      </FPopup1TemplateProvider>
    </div>
  );
};
```

## Configuration Options

### FPopup1Config

- **id**: Unique identifier for the popup instance
- **headers**: Array of header bar configurations
- **tabs**: Array of tab configurations
- **urlConfig**: URL parameter and storage settings
- **closeButtonConfig**: Optional close button customization
- **modalConfig**: Optional modal size settings

### Header Types

- **url-display**: Shows the current browser URL
- **pathname-actions**: Shows pathname with custom actions

### Color Schemes

The system fetches colors from the `custom_colors` database table:
- `{colorScheme}_bgcolor1`: Background color
- `{colorScheme}_textcolor1`: Text color

## URL Parameters

- `fpop=open`: Opens the popup
- `ptab1=active`, `ptab2=active`, etc.: Sets active tab

## localStorage

- Remembers last active tab per popup instance
- Key format: `{storageKey}` from config

## Database Dependencies

Requires `custom_colors` table with color definitions for header styling.