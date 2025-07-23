import { HeaderRowDefinition } from '../config/tableConfig.sample';
import { processHeaderRows, HeaderRowRenderOptions } from './favaHeaderRows';
import SunRowsHeader from '../sunrowslots/SunRowsHeader';
import { useSunRows } from '../sunrowslots/useSunRows';

interface MinimalTableProps {
  // Data props
  headers?: string[]; // Made optional for backward compatibility
  headerRows?: HeaderRowDefinition[]; // New header row configuration support
  data: any[][];
  
  // Sun Rows system props
  useSunRows?: boolean; // Enable sun rows system
  sunRowsPageKey?: string; // Page key for sun rows config
  sunRowsUtgId?: string | number; // UTG ID for sun rows scoping
  
  // Base element styling props
  tableClassName?: string;
  theadClassName?: string;
  tbodyClassName?: string;
  thClassName?: string;
  tdClassName?: string;
  trClassName?: string;
  headerTrClassName?: string;
  bodyTrClassName?: string;
  
  // Event handlers
  onCellClick?: (rowIndex: number, colIndex: number, value: any) => void;
  onHeaderClick?: (colIndex: number, headerName: string) => void;
  onRowClick?: (rowIndex: number, rowData: any[]) => void;
  
  // Dynamic properties
  cellTooltips?: string[][];
  cellIds?: string[][];
  cellClasses?: string[][];
}

export default function FavaMinimalTable({
  headers,
  headerRows,
  data,
  useSunRows: enableSunRows = false,
  sunRowsPageKey,
  sunRowsUtgId,
  tableClassName,
  theadClassName,
  tbodyClassName,
  thClassName,
  tdClassName,
  trClassName,
  headerTrClassName,
  bodyTrClassName,
  onCellClick,
  onHeaderClick,
  onRowClick,
  cellTooltips,
  cellIds,
  cellClasses
}: MinimalTableProps) {
  // Sun Rows system integration
  const sunRowsResult = useSunRows(
    enableSunRows ? sunRowsPageKey : undefined,
    enableSunRows ? sunRowsUtgId : undefined
  );

  // Process header rows if provided (existing system)
  const processedHeaderRows = headerRows ? processHeaderRows(headerRows, {
    onHeaderClick,
    defaultThClassName: thClassName,
    defaultTrClassName: headerTrClassName || trClassName,
    enableSorting: true
  }) : null;

  return (
    <table 
      className={tableClassName}
      style={{
        borderCollapse: 'collapse',
        border: '1px solid #d7d7d7'
      }}
    >
      {/* Priority order: Sun Rows > Header Rows > Simple Headers */}
      {enableSunRows ? (
        <SunRowsHeader 
          config={sunRowsResult.config}
          loading={sunRowsResult.isLoading}
        />
      ) : (
        <thead className={theadClassName}>
          {/* Render configured header rows or fallback to simple headers */}
          {processedHeaderRows ? (
          processedHeaderRows.map((headerRow) => (
            <tr 
              key={headerRow.id}
              className={headerRow.className || headerTrClassName || trClassName}
              style={{ 
                height: headerRow.height,
                ...(headerRow.type === 'label' ? { fontWeight: 'bold' } : {})
              }}
            >
              {headerRow.processedCells.map((cell) => (
                <th 
                  key={cell.key}
                  className={cell.className || thClassName}
                  colSpan={cell.colSpan || 1}
                  onClick={cell.onClick}
                  style={{
                    ...cell.style,
                    border: '1px solid #d7d7d7',
                    fontSize: '16px'
                  }}
                >
                  {cell.content}
                </th>
              ))}
            </tr>
          ))
        ) : (
          /* Fallback to simple headers for backward compatibility */
          <tr className={headerTrClassName || trClassName}>
            {headers?.map((header, colIndex) => (
              <th 
                key={colIndex}
                className={thClassName}
                onClick={() => onHeaderClick?.(colIndex, header)}
                style={{ 
                  cursor: onHeaderClick ? 'pointer' : 'default',
                  border: '1px solid #d7d7d7',
                  fontSize: '16px'
                }}
              >
                {header}
              </th>
            ))}
          </tr>
        )}
        </thead>
      )}
      <tbody className={tbodyClassName}>
        {data.map((row, rowIndex) => (
          <tr 
            key={rowIndex}
            className={bodyTrClassName || trClassName}
            onClick={() => onRowClick?.(rowIndex, row)}
            style={{ cursor: onRowClick ? 'pointer' : 'default' }}
          >
            {row.map((cell, colIndex) => (
              <td 
                key={colIndex}
                className={cellClasses?.[rowIndex]?.[colIndex] || tdClassName}
                title={cellTooltips?.[rowIndex]?.[colIndex]}
                id={cellIds?.[rowIndex]?.[colIndex]}
                onClick={(e) => {
                  e.stopPropagation(); // Prevent row click when cell is clicked
                  onCellClick?.(rowIndex, colIndex, cell);
                }}
                style={{ 
                  cursor: onCellClick ? 'pointer' : 'default',
                  border: '1px solid #d7d7d7',
                  fontSize: '16px'
                }}
              >
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}