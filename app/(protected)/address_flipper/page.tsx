'use client';

import { useState } from 'react';

export default function AddressFlipperPage() {
  const [addressInput, setAddressInput] = useState('');
  const [autoPopulateCountry, setAutoPopulateCountry] = useState(true);
  const [copyFeedback, setCopyFeedback] = useState('');
  const [parsedAddress, setParsedAddress] = useState({
    street: '',
    city: '',
    state: '',
    zip: '',
    country: ''
  });

  const parseAddress = (address: string) => {
    // Basic address parsing logic
    const parts = address.split(',').map(part => part.trim());
    
    let street = '';
    let city = '';
    let state = '';
    let zip = '';
    let country = '';

    if (parts.length >= 1) {
      street = parts[0];
    }
    
    if (parts.length >= 2) {
      city = parts[1];
    }
    
    if (parts.length >= 3) {
      // Handle state and zip which are often in the same part
      const stateZipPart = parts[2].trim();
      const stateZipMatch = stateZipPart.match(/^([A-Z]{2})\s+(\d{5}(?:-\d{4})?)$/);
      
      if (stateZipMatch) {
        state = stateZipMatch[1];
        zip = stateZipMatch[2];
      } else {
        // Try to split by space for state and zip
        const lastSpaceIndex = stateZipPart.lastIndexOf(' ');
        if (lastSpaceIndex !== -1) {
          state = stateZipPart.substring(0, lastSpaceIndex).trim();
          zip = stateZipPart.substring(lastSpaceIndex + 1).trim();
        } else {
          state = stateZipPart;
        }
      }
    }
    
    if (parts.length >= 4) {
      country = parts[3];
    } else if (autoPopulateCountry) {
      // Auto-populate with "United States" if option is checked
      country = 'United States';
    } else {
      // Leave country empty if not specified and auto-populate is off
      country = '';
    }

    setParsedAddress({
      street,
      city,
      state,
      zip,
      country
    });
  };

  const handleSubmit = () => {
    if (addressInput.trim()) {
      parseAddress(addressInput);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  // Spreadsheet data
  const columnAData = ['street', 'city', 'state', 'zip', 'country', '', ''];
  const getColumnBData = () => {
    return [
      parsedAddress.street,
      parsedAddress.city,
      parsedAddress.state,
      parsedAddress.zip,
      parsedAddress.country,
      '',
      ''
    ];
  };

  const handleCellClick = (content: string) => {
    if (content) {
      navigator.clipboard.writeText(content);
    }
  };

  const copyColumnBData = () => {
    const columnBValues = [
      parsedAddress.street,
      parsedAddress.city,
      parsedAddress.state,
      parsedAddress.zip,
      parsedAddress.country
    ].filter(val => val !== ''); // Only include non-empty values
    
    if (columnBValues.length === 0) {
      setCopyFeedback('No address data to copy. Please submit an address first.');
      setTimeout(() => setCopyFeedback(''), 3000);
      return;
    }
    
    const textToCopy = columnBValues.join('\n');
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopyFeedback(`✅ Copied ${columnBValues.length} rows to clipboard!`);
      setTimeout(() => setCopyFeedback(''), 3000);
    }).catch(() => {
      setCopyFeedback('❌ Failed to copy to clipboard. Please try again.');
      setTimeout(() => setCopyFeedback(''), 3000);
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Address Flipper</h1>
        
        {/* Input Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          {/* Auto-populate setting */}
          <div className="mb-4">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={autoPopulateCountry}
                onChange={(e) => setAutoPopulateCountry(e.target.checked)}
                className="mr-2 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-gray-700">
                Auto-populate "United States" as country if none provided
              </span>
            </label>
          </div>
          
          <label 
            htmlFor="addressInput" 
            className="block text-black font-bold mb-3"
            style={{ fontSize: '16px' }}
          >
            Paste your full address here
          </label>
          <div className="flex gap-3">
            <input
              id="addressInput"
              type="text"
              value={addressInput}
              onChange={(e) => setAddressInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="e.g., 6213 S Miller Rd Suite 1120, Buckeye, AZ 85326"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleSubmit}
              className="px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Submit
            </button>
          </div>
        </div>

        {/* Spreadsheet Grid */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="overflow-x-auto">
            <table className="border-collapse border border-gray-400">
              <thead>
                <tr>
                  <th className="border border-gray-400 bg-gray-100 p-2 w-12"></th>
                  <th className="border border-gray-400 bg-gray-100 p-2 w-32 font-medium">A</th>
                  <th className="border border-gray-400 bg-gray-100 p-2 font-medium" style={{ minWidth: '300px' }}>B</th>
                  <th className="border border-gray-400 bg-gray-100 p-2 w-32 font-medium">C</th>
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3, 4, 5, 6, 7].map((rowNum, index) => (
                  <tr key={rowNum}>
                    <td className="border border-gray-400 bg-gray-100 p-2 text-center font-medium">
                      {rowNum}
                    </td>
                    <td 
                      className="border border-gray-400 p-2 cursor-pointer hover:bg-blue-50"
                      onClick={() => handleCellClick(columnAData[index])}
                    >
                      {columnAData[index]}
                    </td>
                    <td 
                      className="border border-gray-400 p-2 cursor-pointer hover:bg-blue-50 whitespace-nowrap"
                      onClick={() => handleCellClick(getColumnBData()[index])}
                    >
                      {getColumnBData()[index]}
                    </td>
                    <td className="border border-gray-400 p-2">
                      
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Copy Button */}
          <div className="mt-4 flex items-center gap-4">
            <button
              onClick={copyColumnBData}
              className="px-6 py-2 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              Copy 5 rows from column B
            </button>
            {copyFeedback && (
              <span className={`text-sm font-medium ${
                copyFeedback.includes('✅') ? 'text-green-600' : 
                copyFeedback.includes('❌') ? 'text-red-600' : 
                'text-yellow-600'
              }`}>
                {copyFeedback}
              </span>
            )}
          </div>
          
          <div className="mt-4 text-sm text-gray-600">
            <p>💡 Click any cell to copy its content to clipboard</p>
            <p className="mt-1">📋 Address format: Street, City, State ZIP</p>
          </div>
        </div>
      </div>
    </div>
  );
}