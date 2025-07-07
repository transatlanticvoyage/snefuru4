interface MinimalTableProps {
  // Data props
  headers: string[];
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

export default function MinimalTable({
  headers,
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
}: MinimalTableProps) {
  return (
    <table className={tableClassName}>
      <thead className={theadClassName}>
        <tr className={headerTrClassName || trClassName}>
          {headers.map((header, colIndex) => (
            <th 
              key={colIndex}
              className={thClassName}
              onClick={() => onHeaderClick?.(colIndex, header)}
              style={{ cursor: onHeaderClick ? 'pointer' : 'default' }}
            >
              {header}
            </th>
          ))}
        </tr>
      </thead>
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
                style={{ cursor: onCellClick ? 'pointer' : 'default' }}
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