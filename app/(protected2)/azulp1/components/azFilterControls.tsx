export default function AzFilterControls() {
  const wrapperStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '8px'
  };

  const selectStyle = {
    padding: '8px 12px',
    border: '2px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    background: '#fff',
    cursor: 'pointer',
    outline: 'none',
    minWidth: '150px'
  };

  const labelStyle = {
    fontSize: '14px',
    fontWeight: '600' as const,
    color: '#555'
  };

  return (
    <div style={wrapperStyle}>
      <span style={labelStyle}>Filter:</span>
      <select style={selectStyle}>
        <option>All Categories</option>
        <option>Layout</option>
        <option>Navigation</option>
        <option>Content</option>
        <option>Forms</option>
      </select>
      <select style={selectStyle}>
        <option>All Status</option>
        <option>True</option>
        <option>False</option>
      </select>
    </div>
  );
}