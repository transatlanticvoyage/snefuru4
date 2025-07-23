import { useState } from 'react';

export default function FavaSearchBox() {
  const [searchValue, setSearchValue] = useState('');

  const wrapperStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '8px'
  };

  const searchContainerStyle = {
    display: 'flex',
    alignItems: 'center'
  };

  const inputStyle = {
    padding: '10px 12px',
    border: '2px solid #ddd',
    borderRadius: '4px 0 0 4px',
    fontSize: '16px',
    width: '300px',
    outline: 'none'
  };

  const clearButtonStyle = {
    padding: '10px 8px',
    border: '2px solid #ddd',
    borderLeft: 'none',
    borderRadius: '0 4px 4px 0',
    backgroundColor: '#fffacd',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 'bold',
    minWidth: '32px',
    height: '44px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };

  const handleClear = () => {
    setSearchValue('');
  };

  return (
    <div style={wrapperStyle}>
      <div style={searchContainerStyle}>
        <input 
          type="text" 
          placeholder="Search..." 
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          style={inputStyle}
        />
        <button 
          onClick={handleClear}
          style={clearButtonStyle}
        >
          CL
        </button>
      </div>
    </div>
  );
}