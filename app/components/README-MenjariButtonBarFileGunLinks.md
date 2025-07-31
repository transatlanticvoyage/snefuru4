# MenjariButtonBarFileGunLinks Component

A reusable navigation component that provides quick access to FileGun, FileJar, and FolderJar admin pages.

## Features

- 3 horizontal navigation links to `/admin/filegun`, `/admin/filejar`, `/admin/folderjar`
- Uses proper Next.js Link components for client-side navigation
- Supports standard browser behavior (Ctrl+Click/Cmd+Click for new tab)
- Clean, consistent styling that matches the existing FileGun UI
- Can be dynamically imported into any page
- Responsive design with hover effects
- Accessibility features with proper titles and descriptions

## Usage

### Static Import
```tsx
import MenjariButtonBarFileGunLinks from '@/app/components/MenjariButtonBarFileGunLinks';

export default function MyPage() {
  return (
    <div>
      <h1>My Page</h1>
      <MenjariButtonBarFileGunLinks />
    </div>
  );
}
```

### Dynamic Import
```tsx
import dynamic from 'next/dynamic';

const MenjariButtonBarFileGunLinks = dynamic(
  () => import('@/app/components/MenjariButtonBarFileGunLinks'),
  { ssr: false }
);

export default function MyPage() {
  return (
    <div>
      <h1>My Page</h1>
      <MenjariButtonBarFileGunLinks />
    </div>
  );
}
```

### With Custom Styling
```tsx
import MenjariButtonBarFileGunLinks from '@/app/components/MenjariButtonBarFileGunLinks';

export default function MyPage() {
  return (
    <div>
      <h1>My Page</h1>
      <MenjariButtonBarFileGunLinks className="mt-6 max-w-4xl mx-auto" />
    </div>
  );
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| className | string | '' | Additional CSS classes to apply to the container |

## Styling

The component uses a consistent design that matches the FileGun UI:
- Gray-50 background with blue hover states
- Consistent padding and spacing
- Subtle shadows and borders
- Smooth transitions on hover
- Responsive layout that works on all screen sizes

## Browser Behavior

- **Regular Click**: Navigate to the page in the same tab
- **Ctrl+Click (PC) / Cmd+Click (Mac)**: Open in new tab
- **Middle Click**: Open in new tab (standard browser behavior)
- **Right Click**: Show context menu with "Open in new tab" option