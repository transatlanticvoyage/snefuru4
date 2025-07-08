export default function AzSearchBox() {
  const wrapperStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '8px'
  };

  const inputStyle = {
    padding: '10px 12px',
    border: '2px solid #ddd',
    borderRadius: '4px',
    fontSize: '16px',
    width: '300px',
    outline: 'none'
  };

  return (
    <div style={wrapperStyle}>
      <input 
        type="text" 
        placeholder="Search..." 
        style={inputStyle}
      />
    </div>
  );
}