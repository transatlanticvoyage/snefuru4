/**
 * Azul Plantilla Table Configuration Template
 * 
 * This file demonstrates all possible configuration options for deploying
 * the table template system to new pages. Copy this file and customize
 * for your specific use case.
 */

export interface ColumnDefinition {
  field: string;           // Database column name
  header: string;          // Display header text
  width?: string;          // Optional: '100px', '20%', 'auto'
  sortable?: boolean;      // Default: true
  searchable?: boolean;    // Include in search? Default: true
  editable?: boolean;      // Allow inline editing? Default: false
  type?: 'text' | 'number' | 'date' | 'boolean' | 'json';
  format?: (value: any) => string;  // Custom formatter
}

export interface HeaderRowDefinition {
  id: string;              // Unique identifier for the header row
  type: 'label' | 'filter' | 'toolbar' | 'custom';  // Type of header row
  height?: string;         // Optional: '40px', '60px', etc.
  className?: string;      // Optional: Custom CSS class
  cells: HeaderCellDefinition[];  // Cells in this header row
}

export interface HeaderCellDefinition {
  content: string | React.ReactNode;  // Cell content
  colSpan?: number;        // Number of columns to span
  className?: string;      // Optional: Custom CSS class
  style?: React.CSSProperties;  // Optional: Inline styles
  alignment?: 'left' | 'center' | 'right';  // Text alignment
}

export interface FilterDefinition {
  id: string;              // Unique identifier
  label: string;           // Display label
  type: 'dropdown' | 'multiselect' | 'daterange' | 'boolean' | 'text' | 'range';
  column: string;          // Database column to filter
  operator?: 'eq' | 'like' | 'gt' | 'lt' | 'in' | 'between';
  
  // For dropdown/multiselect
  options?: Array<{value: string; label: string}>;
  loadOptions?: () => Promise<Array<{value: string; label: string}>>;
  
  // For range
  min?: number;
  max?: number;
  step?: number;
  
  // For daterange
  dateFormat?: string;
  presets?: Array<{value: string; label: string}>;
}

export interface TableConfig {
  // Data Source
  tableName: string;                    // Required: Supabase table
  viewName?: string;                    // Optional: Use a database view instead
  customQuery?: () => any;              // Optional: Custom Supabase query builder
  
  // Columns
  columns: ColumnDefinition[];          // Required: Define visible columns
  defaultVisibleColumns?: string[];     // Optional: Initially visible columns
  
  // Header Rows (1-10 rows in <thead>)
  headerRows: HeaderRowDefinition[];    // Required: Must have at least 1 header row
  enableColumnSorting?: boolean;        // Optional: Add sorting to header rows
  
  // Filters
  filters?: FilterDefinition[];         // Optional: Filter configurations
  defaultFilters?: Record<string, any>; // Optional: Default filter values
  
  // Pagination
  pageSizes?: number[];                 // Default: [10, 25, 50, 100, 200]
  defaultPageSize?: number;             // Default: 25
  showAllOption?: boolean;              // Default: true
  
  // Sorting
  defaultSort?: {
    field: string;
    order: 'asc' | 'desc';
  };
  multiSort?: boolean;                  // Allow sorting by multiple columns
  
  // Search
  enableSearch?: boolean;               // Default: true
  searchPlaceholder?: string;           // Default: "Search..."
  searchDebounceMs?: number;            // Default: 300
  searchFields?: string[];              // Specific fields to search (default: all)
  
  // Features
  enableInlineEdit?: boolean;           // Default: false
  enableBulkActions?: boolean;          // Default: false
  enableExport?: boolean;               // Default: false
  enableColumnToggle?: boolean;         // Default: true
  
  // Row Actions
  rowActions?: Array<{
    label: string;
    icon?: string;
    action: (row: any) => void;
    condition?: (row: any) => boolean;  // Show/hide based on row data
  }>;
  
  // Bulk Actions
  bulkActions?: Array<{
    label: string;
    icon?: string;
    action: (selectedRows: any[]) => void;
    requireConfirm?: boolean;
  }>;
  
  // Events
  onRowClick?: (row: any) => void;
  onCellClick?: (row: any, column: string, value: any) => void;
  beforeSave?: (row: any, changes: any) => Promise<boolean>;
  afterSave?: (row: any) => void;
  
  // Styling
  tableClassName?: string;
  customStyles?: {
    headerRow?: React.CSSProperties;
    dataRow?: React.CSSProperties;
    cell?: React.CSSProperties;
  };
  
  // Advanced
  pollingInterval?: number;             // Auto-refresh data (milliseconds)
  cacheTimeout?: number;                // Client-side cache duration
  optimisticUpdate?: boolean;           // Update UI before server confirms
}

// Example configurations for different use cases:

// 1. Simple read-only table (1 header row)
export const simpleTableConfig: TableConfig = {
  tableName: 'products',
  columns: [
    { field: 'id', header: 'ID', width: '80px' },
    { field: 'name', header: 'Product Name' },
    { field: 'price', header: 'Price', type: 'number', format: (v) => `$${v.toFixed(2)}` },
    { field: 'stock', header: 'Stock', type: 'number' }
  ],
  headerRows: [
    {
      id: 'main-header',
      type: 'label',
      cells: [
        { content: 'ID', alignment: 'center' },
        { content: 'Product Name', alignment: 'left' },
        { content: 'Price', alignment: 'right' },
        { content: 'Stock', alignment: 'center' }
      ]
    }
  ]
};

// 2. Advanced editable table with multiple header rows
export const advancedTableConfig: TableConfig = {
  tableName: 'users',
  columns: [
    { field: 'id', header: 'ID', width: '80px', editable: false },
    { field: 'email', header: 'Email', editable: true },
    { field: 'full_name', header: 'Name', editable: true },
    { field: 'role', header: 'Role', editable: true },
    { field: 'status', header: 'Status', editable: true },
    { field: 'created_at', header: 'Created', type: 'date', editable: false }
  ],
  headerRows: [
    {
      id: 'category-header',
      type: 'label',
      height: '50px',
      className: 'bg-blue-100',
      cells: [
        { content: 'User Info', colSpan: 3, alignment: 'center', className: 'font-bold' },
        { content: 'Access Control', colSpan: 2, alignment: 'center', className: 'font-bold' },
        { content: 'Metadata', alignment: 'center', className: 'font-bold' }
      ]
    },
    {
      id: 'main-header',
      type: 'label',
      cells: [
        { content: 'ID', alignment: 'center' },
        { content: 'Email', alignment: 'left' },
        { content: 'Full Name', alignment: 'left' },
        { content: 'Role', alignment: 'center' },
        { content: 'Status', alignment: 'center' },
        { content: 'Created Date', alignment: 'center' }
      ]
    },
    {
      id: 'filter-row',
      type: 'filter',
      height: '40px',
      cells: [
        { content: '', alignment: 'center' }, // No filter for ID
        { content: '🔍', alignment: 'center' }, // Search icon for email
        { content: '🔍', alignment: 'center' }, // Search icon for name
        { content: '▼', alignment: 'center' }, // Dropdown for role
        { content: '▼', alignment: 'center' }, // Dropdown for status
        { content: '📅', alignment: 'center' }  // Date picker for created
      ]
    }
  ],
  filters: [
    {
      id: 'status',
      label: 'Status',
      type: 'dropdown',
      column: 'status',
      options: [
        { value: 'all', label: 'All Status' },
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' }
      ]
    },
    {
      id: 'role',
      label: 'Role',
      type: 'multiselect',
      column: 'role',
      operator: 'in',
      loadOptions: async () => {
        // Fetch from database
        return [
          { value: 'admin', label: 'Administrator' },
          { value: 'user', label: 'Regular User' },
          { value: 'guest', label: 'Guest' }
        ];
      }
    },
    {
      id: 'created',
      label: 'Created Date',
      type: 'daterange',
      column: 'created_at',
      presets: [
        { value: 'today', label: 'Today' },
        { value: 'week', label: 'This Week' },
        { value: 'month', label: 'This Month' }
      ]
    }
  ],
  enableInlineEdit: true,
  enableBulkActions: true,
  bulkActions: [
    {
      label: 'Activate',
      action: async (rows) => {
        // Update selected rows
      }
    },
    {
      label: 'Delete',
      action: async (rows) => {
        // Delete selected rows
      },
      requireConfirm: true
    }
  ],
  rowActions: [
    {
      label: 'Edit',
      action: (row) => {
        // Open edit modal
      }
    },
    {
      label: 'Delete',
      action: (row) => {
        // Delete row
      },
      condition: (row) => row.status !== 'active'
    }
  ]
};

// 3. Custom view with complex filters
export const customViewConfig: TableConfig = {
  viewName: 'order_summary_view',  // Using a database view
  columns: [
    { field: 'order_id', header: 'Order #', width: '100px' },
    { field: 'customer_name', header: 'Customer' },
    { field: 'total_amount', header: 'Total', type: 'number', format: (v) => `$${v.toFixed(2)}` },
    { field: 'order_status', header: 'Status' },
    { field: 'item_count', header: 'Items', type: 'number' }
  ],
  filters: [
    {
      id: 'amount_range',
      label: 'Order Total',
      type: 'range',
      column: 'total_amount',
      min: 0,
      max: 10000,
      step: 100
    },
    {
      id: 'status',
      label: 'Order Status',
      type: 'dropdown',
      column: 'order_status',
      options: [
        { value: 'all', label: 'All Orders' },
        { value: 'pending', label: 'Pending' },
        { value: 'processing', label: 'Processing' },
        { value: 'shipped', label: 'Shipped' },
        { value: 'delivered', label: 'Delivered' }
      ]
    }
  ],
  defaultSort: {
    field: 'created_at',
    order: 'desc'
  },
  onRowClick: (row) => {
    // Navigate to order details
    window.location.href = `/orders/${row.order_id}`;
  }
};