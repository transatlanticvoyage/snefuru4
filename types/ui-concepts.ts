/**
 * UI Concept Type Definitions
 * These types document custom UI patterns and concepts used in the codebase
 */

/**
 * Prisomi Column Configuration
 * A dynamically generated row numbering column that counts ALL table rows
 * including both header (th) and data (td) rows
 * 
 * @see /docs/CODE_CONCEPTS.md#prisomi_-prisomi-column
 */
export interface PrisomiColumnConfig {
  /** Whether to display the prisomi column */
  enabled: boolean;
  
  /** Starting number (usually 1) */
  startNumber?: number;
  
  /** Column header text */
  headerText?: string;
  
  /** CSS classes for styling */
  className?: string;
  
  /** Whether to count header rows */
  includeHeaderRows?: boolean;
}

/**
 * Example prisomi column data structure
 */
export interface PrisomiRow {
  /** The prisomi number for this row */
  prisomiNumber: number;
  
  /** Whether this is a header row */
  isHeaderRow: boolean;
  
  /** The actual row content */
  content: any;
}