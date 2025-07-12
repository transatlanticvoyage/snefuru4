export default function FavaPaginationControls() {
  const wrapperStyle = {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px'
  };

  const buttonBarStyle = {
    display: 'flex'
  };

  const qtyButtonStyle = {
    padding: '8px 12px',
    border: '1px solid #ccc',
    background: '#f8f9fa',
    cursor: 'pointer',
    fontSize: '14px'
  };

  const pageButtonStyle = {
    padding: '8px 12px',
    border: '1px solid #ccc',
    background: '#fff',
    cursor: 'pointer',
    fontSize: '14px'
  };

  const navButtonStyle = {
    padding: '8px 12px',
    border: '1px solid #ccc',
    background: '#e9ecef',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold' as const
  };

  return (
    <div style={wrapperStyle}>
      <div style={buttonBarStyle}>
        <button style={qtyButtonStyle}>10</button>
        <button style={qtyButtonStyle}>25</button>
        <button style={qtyButtonStyle}>50</button>
        <button style={qtyButtonStyle}>100</button>
        <button style={qtyButtonStyle}>200</button>
        <button style={qtyButtonStyle}>All</button>
      </div>
      <div style={buttonBarStyle}>
        <button style={navButtonStyle}>«</button>
        <button style={pageButtonStyle}>1</button>
        <button style={pageButtonStyle}>2</button>
        <button style={pageButtonStyle}>3</button>
        <button style={pageButtonStyle}>4</button>
        <button style={pageButtonStyle}>5</button>
        <button style={navButtonStyle}>»</button>
      </div>
    </div>
  );
}