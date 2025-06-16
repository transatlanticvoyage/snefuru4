'use client';

import { TBN2_COLUMNS, TBN2_COLUMN_SETTINGS } from '../constants/tebnar2-constants';
import { Tebnar2ColumnKey } from '../types/tebnar2-types';

interface Tebnar2ColumnsProps {
  // This component will handle column configuration and customization
  // For now, it's a placeholder that exports the column utilities
}

// Column utility functions that can be used by other components
export const tbn2_getColumnSettings = (columnKey: string) => {
  return TBN2_COLUMN_SETTINGS[columnKey] || { 
    width: 'auto', 
    minWidth: 'auto', 
    maxWidth: 'auto', 
    textAlign: 'left' as const 
  };
};

export const tbn2_getAllColumns = () => {
  return TBN2_COLUMNS;
};

export const tbn2_getImagePreviewColumns = () => {
  return ['image1-preview', 'image2-preview', 'image3-preview', 'image4-preview'];
};

export const tbn2_isImageColumn = (columnKey: string) => {
  return columnKey.includes('fk_image') && columnKey.includes('_id');
};

export const tbn2_isPreviewColumn = (columnKey: string) => {
  return columnKey.includes('-preview');
};

// Column header formatting
export const tbn2_formatColumnHeader = (columnKey: string) => {
  // Convert snake_case to more readable format
  return columnKey
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase())
    .replace(/Fk /g, '')
    .replace(/Id/g, 'ID')
    .replace(/Rel /g, '');
};

// This is a placeholder component for future column configuration UI
export default function Tebnar2Columns(props: Tebnar2ColumnsProps) {
  return (
    <div className="hidden">
      {/* This component is currently just a utility export */}
      {/* Future: Column visibility toggles, reordering, resizing, etc. */}
    </div>
  );
}