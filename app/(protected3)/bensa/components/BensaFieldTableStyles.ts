export const BENSA_COLORS = {
  star: '#149a24',
  flag: '#dc2626',
  gray: '#666',
  border: '#ddd',
  headerBg: '#f5f5f5',
  blue: '#3b82f6',
  green: '#22c55e',
  red: '#ef4444'
};

export const BENSA_TABLE_STYLES = {
  table: {
    borderCollapse: 'collapse' as const,
    border: `1px solid ${BENSA_COLORS.border}`,
    width: 'auto'
  },
  
  headerRow: {
    backgroundColor: BENSA_COLORS.headerBg
  },
  
  headerCell: {
    border: `1px solid ${BENSA_COLORS.border}`,
    padding: '8px',
    fontWeight: 'bold' as const,
    textAlign: 'left' as const,
    whiteSpace: 'nowrap' as const,
    cursor: 'pointer' as const,
    userSelect: 'none' as const,
    position: 'relative' as const
  },
  
  checkboxHeaderCell: {
    border: `1px solid ${BENSA_COLORS.border}`,
    padding: '8px',
    width: '35px',
    whiteSpace: 'nowrap' as const
  },
  
  iconHeaderCell: {
    border: `1px solid ${BENSA_COLORS.border}`,
    padding: '8px',
    width: '35px',
    textAlign: 'center' as const,
    whiteSpace: 'nowrap' as const,
    cursor: 'pointer' as const,
    userSelect: 'none' as const,
    position: 'relative' as const
  },
  
  fieldNameHeaderCell: {
    border: `1px solid ${BENSA_COLORS.border}`,
    padding: '8px',
    width: '300px',
    fontWeight: 'bold' as const,
    textAlign: 'left' as const,
    whiteSpace: 'nowrap' as const,
    cursor: 'pointer' as const,
    userSelect: 'none' as const,
    position: 'relative' as const
  },
  
  bodyCell: {
    border: `1px solid ${BENSA_COLORS.border}`,
    padding: '8px',
    textAlign: 'center' as const
  },
  
  fieldNameCell: {
    border: `1px solid ${BENSA_COLORS.border}`,
    padding: '8px',
    fontWeight: 'bold' as const
  },
  
  valueCell: {
    border: `1px solid ${BENSA_COLORS.border}`,
    padding: '8px'
  }
};

export const BENSA_BUTTON_STYLES = {
  iconButton: {
    border: 'none',
    background: 'none',
    fontSize: '18px',
    cursor: 'pointer' as const,
    transition: 'color 0.2s'
  },
  
  booleanToggle: {
    width: '48px',
    height: '24px',
    borderRadius: '12px',
    border: 'none',
    cursor: 'pointer' as const,
    color: 'white',
    fontSize: '12px',
    fontWeight: 'bold' as const
  },
  
  editButton: {
    padding: '4px 8px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer' as const
  },
  
  saveButton: {
    ...{
      padding: '4px 8px',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer' as const
    },
    backgroundColor: BENSA_COLORS.green,
    color: 'white'
  },
  
  cancelButton: {
    ...{
      padding: '4px 8px',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer' as const
    },
    backgroundColor: BENSA_COLORS.red,
    color: 'white'
  }
};

export const BENSA_INPUT_STYLES = {
  editInput: {
    flex: 1,
    padding: '4px 8px',
    border: `2px solid ${BENSA_COLORS.blue}`,
    borderRadius: '4px',
    outline: 'none'
  }
};

export const BENSA_SORT_INDICATOR_STYLES = {
  sortArrow: {
    position: 'absolute' as const,
    right: '8px',
    top: '50%',
    transform: 'translateY(-50%)',
    fontSize: '12px'
  },
  
  iconSortArrow: {
    position: 'absolute' as const,
    right: '2px',
    top: '50%',
    transform: 'translateY(-50%)',
    fontSize: '10px'
  }
};