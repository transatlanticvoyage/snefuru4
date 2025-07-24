import { HeaderRowDefinition } from '../../config/tableConfig.sample';
import { processHeaderRows, HeaderRowRenderOptions } from '../favaHeaderRows';
import { usePaginatedData } from './favaPaginationProvider';

interface MinimalTablePaginatedProps {
  // Data props
  headers?: string[]; // Made optional for backward compatibility
  headerRows?: HeaderRowDefinition[]; // New header row configuration support
  data: any[][];
  
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

export default function FavaMinimalTablePaginated({
  headers,
  headerRows,
  data,
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
}: MinimalTablePaginatedProps) {
  // Get paginated data from the pagination context
  const paginatedData = usePaginatedData(data);
  
  // Process header rows if provided
  const processedHeaderRows = headerRows ? processHeaderRows(headerRows, {
    onHeaderClick,
    defaultThClassName: thClassName,
    defaultTrClassName: headerTrClassName || trClassName,
    enableSorting: true
  }) : null;

  return (
    <table 
      className={`main-beralis-table ${tableClassName || ''}`}
      style={{
        borderCollapse: 'collapse',
        border: '1px solid #d7d7d7'
      }}
    >
      <thead className={theadClassName}>
        {/* Horomi row - always first row in thead */}
        <tr className="horomi-row">
          <th className="dawncell">dawncell (horomi row + vertomi column origin)</th>
          {(headers || processedHeaderRows?.[0]?.processedCells || []).map((_, colIndex) => (
            <th key={`horomi-${colIndex}`} className="horomi-cell"></th>
          ))}
        </tr>
        
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
              {/* Vertomi column cell */}
              <th className="vertomi-column"></th>
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
            {/* Vertomi column cell */}
            <th className="vertomi-column"></th>
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
      <tbody className={tbodyClassName}>
        {paginatedData.map((row, rowIndex) => {
          // Calculate the actual row index in the original data
          // This is important for event handlers that need the correct index
          const originalRowIndex = rowIndex; // This will be handled by the pagination context
          
          return (
            <tr 
              key={rowIndex}
              className={bodyTrClassName || trClassName}
              onClick={() => onRowClick?.(originalRowIndex, row)}
              style={{ cursor: onRowClick ? 'pointer' : 'default' }}
            >
              {/* Vertomi column cell */}
              <td className="vertomi-column"></td>
              {row.map((cell, colIndex) => (
                <td 
                  key={colIndex}
                  className={cellClasses?.[originalRowIndex]?.[colIndex] || tdClassName}
                  title={cellTooltips?.[originalRowIndex]?.[colIndex]}
                  id={cellIds?.[originalRowIndex]?.[colIndex]}
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent row click when cell is clicked
                    onCellClick?.(originalRowIndex, colIndex, cell);
                  }}
                  style={{ 
                    cursor: onCellClick ? 'pointer' : 'default',
                    border: '1px solid #d7d7d7',
                    fontSize: '16px'
                  }}
                >
                  <div className="senlo-td-inner-wrapper-div">
                    {cell}
                  </div>
                </td>
              ))}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}