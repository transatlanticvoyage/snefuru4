'use client';

import { useState } from 'react';

export default function AzulpSqlPage() {
  const [textBox1, setTextBox1] = useState('');
  const [textBox2, setTextBox2] = useState('');
  const [textBox3, setTextBox3] = useState('');

  const handleSave1 = () => {
    console.log('Saving textbox 1:', textBox1);
    // TODO: Implement save functionality
  };

  const handleSave2 = () => {
    console.log('Saving textbox 2:', textBox2);
    // TODO: Implement save functionality
  };

  const handleSave3 = () => {
    console.log('Saving textbox 3:', textBox3);
    // TODO: Implement save functionality
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1 style={{ fontSize: '24px', marginBottom: '30px' }}>
        Azulp SQL Swipes
      </h1>
      
      <div style={{ 
        display: 'flex', 
        gap: '20px', 
        alignItems: 'flex-start' 
      }}>
        {/* First Column */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <textarea
            value={textBox1}
            onChange={(e) => setTextBox1(e.target.value)}
            style={{
              width: '300px',
              height: '300px',
              padding: '10px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '14px',
              fontFamily: 'monospace',
              resize: 'none'
            }}
            placeholder="Enter SQL or text here..."
          />
          <button
            onClick={handleSave1}
            style={{
              marginTop: '10px',
              padding: '8px 16px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Save
          </button>
        </div>

        {/* Second Column */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <textarea
            value={textBox2}
            onChange={(e) => setTextBox2(e.target.value)}
            style={{
              width: '300px',
              height: '300px',
              padding: '10px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '14px',
              fontFamily: 'monospace',
              resize: 'none'
            }}
            placeholder="Enter SQL or text here..."
          />
          <button
            onClick={handleSave2}
            style={{
              marginTop: '10px',
              padding: '8px 16px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Save
          </button>
        </div>

        {/* Third Column */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <textarea
            value={textBox3}
            onChange={(e) => setTextBox3(e.target.value)}
            style={{
              width: '300px',
              height: '300px',
              padding: '10px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '14px',
              fontFamily: 'monospace',
              resize: 'none'
            }}
            placeholder="Enter SQL or text here..."
          />
          <button
            onClick={handleSave3}
            style={{
              marginTop: '10px',
              padding: '8px 16px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}