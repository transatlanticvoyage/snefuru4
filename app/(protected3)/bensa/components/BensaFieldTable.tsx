'use client';

import { useState, useMemo } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { 
  BensaTableProps, 
  BensaSortState, 
  BensaEditingState,
  BensaFieldDefinition
} from './BensaFieldTableTypes';
import { useBensaFieldMetadata } from '../hooks/useBensaFieldMetadata';
import { 
  BENSA_COLORS, 
  BENSA_TABLE_STYLES, 
  BENSA_BUTTON_STYLES, 
  BENSA_INPUT_STYLES,
  BENSA_SORT_INDICATOR_STYLES
} from './BensaFieldTableStyles';

export default function BensaFieldTable({ config, selectedRecord, onRecordUpdate, onBoxEditorOpen }: BensaTableProps) {
  const [selectedFields, setSelectedFields] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<BensaEditingState>({ field: null, value: '' });
  const [sort, setSort] = useState<BensaSortState>({ sortBy: 'starred', sortDirection: 'asc' });
  
  const { fieldMetadata, toggleFieldStar, toggleFieldFlag } = useBensaFieldMetadata(config.tableName);
  const supabase = createClientComponentClient();

  // Handle sorting
  const handleSort = (column: string) => {
    if (sort.sortBy === column) {
      setSort(prev => ({ ...prev, sortDirection: prev.sortDirection === 'asc' ? 'desc' : 'asc' }));
    } else {
      setSort({ sortBy: column, sortDirection: 'asc' });
    }
  };

  // Get sorted fields
  const getSortedFields = () => {
    const fieldsWithMetadata = config.fields.map(field => ({
      ...field,
      starred: fieldMetadata[field.key]?.starred || false,
      flagged: fieldMetadata[field.key]?.flagged || false,
      value: selectedRecord ? selectedRecord[field.key] : null
    }));

    return fieldsWithMetadata.sort((a, b) => {
      let compareResult = 0;

      switch (sort.sortBy) {
        case 'starred':
          compareResult = (b.starred ? 1 : 0) - (a.starred ? 1 : 0);
          break;
        case 'flagged':
          compareResult = (b.flagged ? 1 : 0) - (a.flagged ? 1 : 0);
          break;
        case 'field_name':
          compareResult = a.key.localeCompare(b.key);
          break;
        case 'value':
          const aVal = a.value?.toString() || '';
          const bVal = b.value?.toString() || '';
          compareResult = aVal.localeCompare(bVal);
          break;
        default:
          compareResult = 0;
      }

      return sort.sortDirection === 'asc' ? compareResult : -compareResult;
    });
  };

  // Field editing handlers
  const handleFieldClick = (field: string, currentValue: any) => {
    const fieldConfig = config.fields.find(f => f.key === field);
    if (!fieldConfig?.editable) return;

    setEditing({ field, value: currentValue?.toString() || '' });
  };

  const handleFieldSave = async () => {
    if (!editing.field) return;

    const fieldConfig = config.fields.find(f => f.key === editing.field);
    let processedValue: any = editing.value;

    if (fieldConfig?.type === 'integer') {
      processedValue = editing.value === '' ? null : parseInt(editing.value);
      if (isNaN(processedValue)) processedValue = null;
    } else if (fieldConfig?.type === 'boolean') {
      processedValue = editing.value === 'true';
    } else if (editing.value === '') {
      processedValue = null;
    }

    await onRecordUpdate(editing.field, processedValue);
    setEditing({ field: null, value: '' });
  };

  const handleFieldCancel = () => {
    setEditing({ field: null, value: '' });
  };

  const handleBooleanToggle = async (field: string, currentValue: boolean | null) => {
    const newValue = currentValue === null ? true : !currentValue;
    await onRecordUpdate(field, newValue);
  };

  // Checkbox handlers
  const handleFieldCheckboxChange = (field: string, checked: boolean) => {
    const newSelected = new Set(selectedFields);
    if (checked) {
      newSelected.add(field);
    } else {
      newSelected.delete(field);
    }
    setSelectedFields(newSelected);
  };

  const handleSelectAllFields = (checked: boolean) => {
    if (checked) {
      setSelectedFields(new Set(config.fields.map(f => f.key)));
    } else {
      setSelectedFields(new Set());
    }
  };

  // Render cell content
  const renderCell = (field: BensaFieldDefinition & { starred: boolean; flagged: boolean; value: any }) => {
    const isEditing = editing.field === field.key;
    const isReadOnly = !field.editable;

    if (field.type === 'boolean' && field.editable) {
      return (
        <button
          onClick={() => handleBooleanToggle(field.key, field.value as boolean | null)}
          style={{
            ...BENSA_BUTTON_STYLES.booleanToggle,
            backgroundColor: field.value === true ? BENSA_COLORS.green : 
                            field.value === false ? BENSA_COLORS.gray : '#fbbf24'
          }}
        >
          {field.value === true ? 'true' : field.value === false ? 'false' : 'null'}
        </button>
      );
    }

    if (isEditing) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="text"
            value={editing.value}
            onChange={(e) => setEditing(prev => ({ ...prev, value: e.target.value }))}
            onBlur={handleFieldSave}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleFieldSave();
              if (e.key === 'Escape') handleFieldCancel();
            }}
            style={BENSA_INPUT_STYLES.editInput}
            autoFocus
          />
          <button onClick={handleFieldSave} style={BENSA_BUTTON_STYLES.saveButton}>✓</button>
          <button onClick={handleFieldCancel} style={BENSA_BUTTON_STYLES.cancelButton}>✕</button>
        </div>
      );
    }

    // Special handling for fields that need box editor
    if ((field.key === 'utg_columns_definition_location' || 
         field.key === 'filters_notes' || 
         field.key === 'pagination_notes' || 
         field.key === 'searchbox_notes') && onBoxEditorOpen) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => onBoxEditorOpen(field.key, field.value || '', selectedRecord, onRecordUpdate)}
            style={{
              padding: '4px 8px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 'bold'
            }}
          >
            BOX EDITOR
          </button>
          <span style={{ 
            fontSize: '12px', 
            color: '#666',
            maxWidth: '200px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {field.value ? (field.value.length > 30 ? field.value.substring(0, 30) + '...' : field.value) : ''}
          </span>
        </div>
      );
    }

    return (
      <div
        onClick={() => handleFieldClick(field.key, field.value)}
        style={{
          cursor: field.editable ? 'pointer' : 'default',
          padding: '4px',
          borderRadius: '4px',
          backgroundColor: field.editable ? 'transparent' : '#f9f9f9',
          color: field.editable ? '#000' : BENSA_COLORS.gray,
          minHeight: '20px',
          maxWidth: '200px',
          wordWrap: 'break-word',
          overflowWrap: 'break-word'
        }}
        title={field.editable ? 'Click to edit' : 'Read only'}
      >
        {field.type === 'timestamp' && field.value
          ? new Date(field.value as string).toLocaleString()
          : field.value?.toString() || ''
        }
      </div>
    );
  };

  const sortedFields = getSortedFields();

  return (
    <div style={{ marginTop: '20px' }}>
      <table style={BENSA_TABLE_STYLES.table}>
        <thead>
          <tr style={BENSA_TABLE_STYLES.headerRow}>
            <th style={BENSA_TABLE_STYLES.checkboxHeaderCell}>
              <input
                type="checkbox"
                checked={selectedFields.size === config.fields.length}
                onChange={(e) => handleSelectAllFields(e.target.checked)}
              />
            </th>
            <th 
              style={BENSA_TABLE_STYLES.iconHeaderCell}
              onClick={() => handleSort('starred')}
            >
              <span style={{ color: BENSA_COLORS.star }}>★</span>
              {sort.sortBy === 'starred' && (
                <span style={BENSA_SORT_INDICATOR_STYLES.iconSortArrow}>
                  {sort.sortDirection === 'asc' ? '▲' : '▼'}
                </span>
              )}
            </th>
            <th 
              style={BENSA_TABLE_STYLES.iconHeaderCell}
              onClick={() => handleSort('flagged')}
            >
              <svg 
                width="16" 
                height="16" 
                viewBox="0 0 16 16" 
                fill={BENSA_COLORS.flag}
                stroke={BENSA_COLORS.flag}
                strokeWidth="1.5"
              >
                <path d="M3 2v12M3 2l7 4-7 4" />
              </svg>
              {sort.sortBy === 'flagged' && (
                <span style={BENSA_SORT_INDICATOR_STYLES.iconSortArrow}>
                  {sort.sortDirection === 'asc' ? '▲' : '▼'}
                </span>
              )}
            </th>
            <th 
              style={BENSA_TABLE_STYLES.fieldNameHeaderCell}
              onClick={() => handleSort('field_name')}
            >
              {config.tableName} db field
              {sort.sortBy === 'field_name' && (
                <span style={BENSA_SORT_INDICATOR_STYLES.sortArrow}>
                  {sort.sortDirection === 'asc' ? '▲' : '▼'}
                </span>
              )}
            </th>
            <th 
              style={BENSA_TABLE_STYLES.headerCell}
              onClick={() => handleSort('value')}
            >
              value
              {sort.sortBy === 'value' && (
                <span style={BENSA_SORT_INDICATOR_STYLES.sortArrow}>
                  {sort.sortDirection === 'asc' ? '▲' : '▼'}
                </span>
              )}
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedFields.map((field) => {
            const isStarred = field.starred;
            const isFlagged = field.flagged;
            
            return (
              <tr key={field.key}>
                <td style={BENSA_TABLE_STYLES.bodyCell}>
                  <input
                    type="checkbox"
                    checked={selectedFields.has(field.key)}
                    onChange={(e) => handleFieldCheckboxChange(field.key, e.target.checked)}
                  />
                </td>
                <td style={BENSA_TABLE_STYLES.bodyCell}>
                  <button
                    onClick={() => toggleFieldStar(field.key)}
                    style={{
                      ...BENSA_BUTTON_STYLES.iconButton,
                      color: isStarred ? BENSA_COLORS.star : BENSA_COLORS.gray
                    }}
                    title={isStarred ? 'Remove star' : 'Add star'}
                  >
                    {isStarred ? '★' : '☆'}
                  </button>
                </td>
                <td style={BENSA_TABLE_STYLES.bodyCell}>
                  <button
                    onClick={() => toggleFieldFlag(field.key)}
                    style={BENSA_BUTTON_STYLES.iconButton}
                    title={isFlagged ? 'Remove flag' : 'Add flag'}
                  >
                    <svg 
                      width="16" 
                      height="16" 
                      viewBox="0 0 16 16" 
                      fill={isFlagged ? BENSA_COLORS.flag : 'none'}
                      stroke={isFlagged ? BENSA_COLORS.flag : BENSA_COLORS.gray}
                      strokeWidth="1.5"
                    >
                      <path d="M3 2v12M3 2l7 4-7 4" />
                    </svg>
                  </button>
                </td>
                <td style={BENSA_TABLE_STYLES.fieldNameCell}>
                  {field.key}
                </td>
                <td style={BENSA_TABLE_STYLES.valueCell}>
                  {renderCell(field)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}