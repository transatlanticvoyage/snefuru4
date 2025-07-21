export default function FavaFilterControls() {
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
      <div className="chamber-label-box chamber-7" style={{ marginRight: '12px' }}>
        Row Filters
      </div>
      <span style={labelStyle}>Filter:</span>

 {/* ------------------------------------------------------------------ */}
      <div>
  {/* ------------------------------------------------------------------ */}
<div>
  <div>

    <div>
      dbtable.<strong>dbfield</strong>
    </div>
      <select style={selectStyle}>
        <option>All Categories</option>
        <option>Layout</option>
        <option>Navigation</option>
        <option>Content</option>
        <option>Forms</option>
      </select>
  </div>
</div>
{/* ------------------------------------------------------------------ */}
      </div>
      <select style={selectStyle}>
        <option>All Status</option>
        <option>True</option>
        <option>False</option>
      </select>
    </div>
  );
}