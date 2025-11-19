'use client';

import { useState, useEffect } from 'react';

export default function CitationCranePage() {
  // Initialize with 20 empty rows
  const [rows, setRows] = useState(() => 
    Array.from({ length: 20 }, () => ({ A: '', B: '', C: '', D: '' }))
  );
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [anchorFeedback, setAnchorFeedback] = useState('');
  const [sharkintaxOutput, setSharkintaxOutput] = useState('');
  const [raiserOutput, setRaiserOutput] = useState('');
  const [activeTab, setActiveTab] = useState(1);
  const [selectedGigId, setSelectedGigId] = useState<number>(1);
  const [atlasViewTab, setAtlasViewTab] = useState<number>(1);
  const [presetGigSelection, setPresetGigSelection] = useState<number>(1);
  const [detectedUrls, setDetectedUrls] = useState<string[]>([]);

  // Hardcoded gig data
  const gigData = [
    {
      gig_ref_id: 1,
      service_type: 'citations',
      gig_link: 'https://legiit.com/citationexpert/i-will-create-high-quality-local-citations-for-any-country',
      qty_properties: 100,
      price: '$50',
      seller_link: 'https://legiit.com/citationexpert',
      atlas_data_plain: `Business Name
Street Address
City
State
Zip / Postal code
Country
Phone
Website
Business Email
Short Description (less than 250 word)
Full Description
Operating Hours
Keywords
Category
Owner Name
Starting year of the business
Number of Employee
Payment Method
Social Media Links (GooglePlus, Facebook, Twitter etc..)
Logo and images`,
      atlas_data_sharkintax: `======================================
Business Name
——————————————————————————————————————

======================================
Street Address
——————————————————————————————————————

======================================
City
——————————————————————————————————————

======================================
State
——————————————————————————————————————

======================================
Zip / Postal code
——————————————————————————————————————

======================================
Country
——————————————————————————————————————

======================================
Phone
——————————————————————————————————————

======================================
Website
——————————————————————————————————————

======================================
Business Email
——————————————————————————————————————

======================================
Short Description (less than 250 word)
——————————————————————————————————————

======================================
Full Description
——————————————————————————————————————

======================================
Operating Hours
——————————————————————————————————————

======================================
Keywords
——————————————————————————————————————

======================================
Category
——————————————————————————————————————

======================================
Owner Name
——————————————————————————————————————

======================================
Starting year of the business
——————————————————————————————————————

======================================
Number of Employee
——————————————————————————————————————

======================================
Payment Method
——————————————————————————————————————

======================================
Social Media Links (GooglePlus, Facebook, Twitter etc..)
——————————————————————————————————————

======================================
Logo and images
——————————————————————————————————————`
    },
    {
      gig_ref_id: 2,
      service_type: 'social profiles',
      gig_link: 'https://legiit.com/se0linkbuilders/i-will-do-hq-social-media-profile-seo-backlinks-link-building',
      qty_properties: 55,
      price: '$10',
      seller_link: 'https://legiit.com/se0linkbuilders',
      atlas_data_plain: `Business name
Website URL
Description
Logo
Keywords
Address
Phone Number
Business E-mail
Video Links
Major Social links`,
      atlas_data_sharkintax: `======================================
Business name
——————————————————————————————————————

======================================
Website URL
——————————————————————————————————————

======================================
Description
——————————————————————————————————————

======================================
Logo
——————————————————————————————————————

======================================
Keywords
——————————————————————————————————————

======================================
Address
——————————————————————————————————————

======================================
Phone Number
——————————————————————————————————————

======================================
Business E-mail
——————————————————————————————————————

======================================
Video Links
——————————————————————————————————————

======================================
Major Social links
——————————————————————————————————————`
    }
  ];

  // Load anchored column A data on component mount
  useEffect(() => {
    const savedColumnA = localStorage.getItem('citationCrane_columnA');
    if (savedColumnA) {
      try {
        const parsedData = JSON.parse(savedColumnA);
        const newRows = [...rows];
        parsedData.forEach((value: string, index: number) => {
          if (index < newRows.length) {
            newRows[index].A = value;
          } else {
            newRows.push({ A: value, B: '', C: '', D: '' });
          }
        });
        setRows(newRows);
      } catch (e) {
        console.error('Failed to load saved column A data:', e);
      }
    }
  }, []);

  const handleCellChange = (rowIndex: number, column: string, value: string) => {
    const newRows = [...rows];
    newRows[rowIndex] = { ...newRows[rowIndex], [column]: value };
    
    // Auto-expand: if user is typing in the last few rows, add more rows
    if (rowIndex >= rows.length - 3) {
      const additionalRows = Array.from({ length: 10 }, () => ({ A: '', B: '', C: '', D: '' }));
      newRows.push(...additionalRows);
    }
    
    setRows(newRows);
  };

  const handlePaste = (e: React.ClipboardEvent, rowIndex: number, column: string) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text');
    
    if (!pasteData) return;
    
    const lines = pasteData.split('\n');
    const hasTabSeparators = pasteData.includes('\t');
    
    // If it's truly single line content (no newlines), just paste into one cell
    if (lines.length === 1) {
      const newRows = [...rows];
      newRows[rowIndex][column as keyof typeof newRows[0]] = pasteData;
      setRows(newRows);
      return;
    }
    
    const newRows = [...rows];
    
    // Parse lines and handle quoted multi-line content
    const cellValues: string[] = [];
    let currentCell = '';
    let insideQuotes = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Check if this line starts a quoted section
      if (!insideQuotes && line.startsWith('"')) {
        insideQuotes = true;
        currentCell = line;
        
        // Check if the quote also ends on this line
        if (line.endsWith('"') && line.length > 1) {
          insideQuotes = false;
          cellValues.push(currentCell);
          currentCell = '';
        }
      }
      // If we're inside quotes, continue building the cell content
      else if (insideQuotes) {
        currentCell += '\n' + line;
        
        // Check if this line ends the quoted section
        if (line.endsWith('"')) {
          insideQuotes = false;
          cellValues.push(currentCell);
          currentCell = '';
        }
      }
      // Regular line (not quoted)
      else {
        cellValues.push(line);
      }
    }
    
    // If there's remaining content (unclosed quote), add it
    if (currentCell) {
      cellValues.push(currentCell);
    }
    
    // Ensure we have enough rows for the pasted data
    const requiredRows = rowIndex + cellValues.length;
    while (newRows.length < requiredRows + 10) {
      newRows.push({ A: '', B: '', C: '', D: '' });
    }
    
    cellValues.forEach((cellValue, cellIndex) => {
      const currentRowIndex = rowIndex + cellIndex;
      
      if (currentRowIndex < newRows.length) {
        if (hasTabSeparators && !cellValue.includes('"')) {
          // Handle tab-separated data (multi-column paste) - but only for non-quoted content
          const cells = cellValue.split('\t');
          const columns = ['A', 'B', 'C', 'D'];
          const startColumnIndex = columns.indexOf(column);
          
          cells.forEach((cell, colIndex) => {
            const targetColumnIndex = startColumnIndex + colIndex;
            if (targetColumnIndex < columns.length) {
              newRows[currentRowIndex][columns[targetColumnIndex]] = cell.trim();
            }
          });
        } else {
          // Handle single-column paste or quoted content
          // Remove surrounding quotes if present
          let finalValue = cellValue;
          if (finalValue.startsWith('"') && finalValue.endsWith('"')) {
            finalValue = finalValue.slice(1, -1);
          }
          newRows[currentRowIndex][column as keyof typeof newRows[0]] = finalValue;
        }
      }
    });
    
    setRows(newRows);
  };

  const anchorColumnA = () => {
    const columnAData = rows.map(row => row.A);
    // Filter out trailing empty rows for storage
    let lastNonEmptyIndex = columnAData.length - 1;
    while (lastNonEmptyIndex >= 0 && columnAData[lastNonEmptyIndex] === '') {
      lastNonEmptyIndex--;
    }
    const dataToSave = columnAData.slice(0, lastNonEmptyIndex + 1);
    
    localStorage.setItem('citationCrane_columnA', JSON.stringify(dataToSave));
    
    setAnchorFeedback('✅ Column A data anchored successfully!');
    setTimeout(() => setAnchorFeedback(''), 3000);
  };

  const clearAllData = () => {
    // Clear the spreadsheet
    setRows(Array.from({ length: 20 }, () => ({ A: '', B: '', C: '', D: '' })));
    // Clear localStorage
    localStorage.removeItem('citationCrane_columnA');
    // Clear sharkintax output
    setSharkintaxOutput('');
    // Close dialog
    setShowConfirmDialog(false);
    
    setAnchorFeedback('🗑️ All data cleared!');
    setTimeout(() => setAnchorFeedback(''), 3000);
  };

  const createSharkintax = () => {
    const sharkintaxParts: string[] = [];
    
    rows.forEach((row) => {
      // Check if column A starts with "gigmark"
      if (row.A.toLowerCase().startsWith('gigmark')) {
        // Find the "// " separator
        const separatorIndex = row.A.indexOf('// ');
        if (separatorIndex !== -1) {
          // Extract text after "// "
          const extractedText = row.A.substring(separatorIndex + 3).trim();
          const columnBValue = row.B.trim();
          
          if (extractedText) {
            // Format as sharkintax
            let sharkintaxBlock = '======================================\n';
            sharkintaxBlock += extractedText + '\n';
            sharkintaxBlock += '——————————————————————————————————————\n';
            sharkintaxBlock += columnBValue || '';
            
            sharkintaxParts.push(sharkintaxBlock);
          }
        }
      }
    });
    
    // Join all parts with line break
    const finalOutput = sharkintaxParts.join('\n');
    setSharkintaxOutput(finalOutput);
    
    if (sharkintaxParts.length > 0) {
      setAnchorFeedback(`✅ Generated sharkintax from ${sharkintaxParts.length} gigmark rows!`);
    } else {
      setAnchorFeedback('⚠️ No gigmark rows found to process');
    }
    setTimeout(() => setAnchorFeedback(''), 3000);
  };

  const orderItemsAccordingToPreset = () => {
    // Validate prerequisites
    if (!sharkintaxOutput.trim()) {
      setAnchorFeedback('⚠️ Please generate sharkintax first');
      setTimeout(() => setAnchorFeedback(''), 3000);
      return;
    }
    
    if (!presetGigSelection) {
      setAnchorFeedback('⚠️ Please select a gig preset first');
      setTimeout(() => setAnchorFeedback(''), 3000);
      return;
    }
    
    const selectedGig = gigData.find(gig => gig.gig_ref_id === presetGigSelection);
    if (!selectedGig) {
      setAnchorFeedback('❌ Selected gig not found');
      setTimeout(() => setAnchorFeedback(''), 3000);
      return;
    }
    
    // Parse sharkintax output to extract unit blocks with their content
    const sharkintaxBlocks: { [key: string]: string } = {};
    const blockParts = sharkintaxOutput.split('======================================').filter(block => block.trim());
    
    blockParts.forEach(block => {
      const lines = block.trim().split('\n');
      if (lines.length > 0) {
        const unitLabel = lines[0].trim();
        if (unitLabel) {
          // Store the complete block including the unit label and content
          sharkintaxBlocks[unitLabel.toLowerCase()] = '======================================\n' + block.trim();
        }
      }
    });
    
    // Parse atlas mapping data to get available units
    const atlasUnits = selectedGig.atlas_data_plain.split('\n')
      .map(line => line.trim())
      .filter(line => line !== '');
    
    // Create ordered output and track unmatched units
    const orderedBlocks: string[] = [];
    const unmatchedUnits: string[] = [];
    const usedSharkintaxUnits = new Set<string>();
    
    // Go through atlas units in order and create blocks for each one
    atlasUnits.forEach(atlasUnit => {
      // Check for exact match (case insensitive)
      const exactMatchKey = Object.keys(sharkintaxBlocks).find(key => 
        key === atlasUnit.toLowerCase()
      );
      
      if (exactMatchKey) {
        // Ensure sharkintax blocks end with single newline for consistent spacing
        let block = sharkintaxBlocks[exactMatchKey];
        if (!block.endsWith('\n')) {
          block += '\n';
        }
        orderedBlocks.push(block);
        usedSharkintaxUnits.add(exactMatchKey);
      } else {
        // Check for partial match
        const partialMatchKey = Object.keys(sharkintaxBlocks).find(key => 
          key.includes(atlasUnit.toLowerCase()) || 
          atlasUnit.toLowerCase().includes(key)
        );
        
        if (partialMatchKey && !usedSharkintaxUnits.has(partialMatchKey)) {
          // Ensure sharkintax blocks end with single newline for consistent spacing
          let block = sharkintaxBlocks[partialMatchKey];
          if (!block.endsWith('\n')) {
            block += '\n';
          }
          orderedBlocks.push(block);
          usedSharkintaxUnits.add(partialMatchKey);
        } else {
          // No match found - create empty block for this atlas unit
          const emptyBlock = `======================================\n${atlasUnit}\n——————————————————————————————————————\n\n`;
          orderedBlocks.push(emptyBlock);
        }
      }
    });
    
    // Find unmatched sharkintax units (units from heaver box that don't match any atlas unit)
    const unmatchedBlocks: string[] = [];
    Object.keys(sharkintaxBlocks).forEach(key => {
      if (!usedSharkintaxUnits.has(key)) {
        // Include the full sharkintax block for unmatched units with consistent spacing
        let block = sharkintaxBlocks[key];
        if (!block.endsWith('\n')) {
          block += '\n';
        }
        unmatchedBlocks.push(block);
      }
    });
    
    // Build the raiser output - ensure proper spacing between blocks
    let raiserContent = orderedBlocks.join('');
    
    // Add unmatched section if there are unmatched units
    if (unmatchedBlocks.length > 0) {
      raiserContent += '######################################\n';
      raiserContent += 'UNMATCHED UNITS PLACED BELOW (no exact match unit label found)\n';
      raiserContent += '######################################\n';
      unmatchedBlocks.forEach(block => {
        raiserContent += block;
      });
    }
    
    setRaiserOutput(raiserContent);
    
    // Extract URLs and domains from the raiser output
    const extractedUrls = extractUrlsAndDomains(raiserContent);
    setDetectedUrls(extractedUrls);
    
    setAnchorFeedback(`✅ Processed ${orderedBlocks.length} total units${unmatchedBlocks.length > 0 ? ` (${unmatchedBlocks.length} unmatched)` : ''}`);
    setTimeout(() => setAnchorFeedback(''), 3000);
  };

  // Function to extract URLs and domains from text
  const extractUrlsAndDomains = (text: string): string[] => {
    const urlRegex = /https?:\/\/[^\s]+/g;
    const domainRegex = /(?:^|\s)([a-zA-Z0-9-]+\.(?:[a-zA-Z]{2,}|[a-zA-Z]{2,}\.[a-zA-Z]{2,}))(?=\s|$)/g;
    
    const urls: string[] = [];
    const domains: string[] = [];
    
    // Extract full URLs
    const urlMatches = text.match(urlRegex);
    if (urlMatches) {
      urls.push(...urlMatches);
    }
    
    // Extract standalone domains
    let domainMatch;
    while ((domainMatch = domainRegex.exec(text)) !== null) {
      domains.push(domainMatch[1]);
    }
    
    // Combine and remove duplicates
    const allUrls = [...new Set([...urls, ...domains])];
    return allUrls;
  };

  // Check if order button should be enabled
  const isOrderButtonEnabled = () => {
    return sharkintaxOutput.trim() !== '' && presetGigSelection !== '';
  };

  const renderMainScreen = () => (
    <>
      <div className="mb-6">
        {/* Text Boxes Container */}
        <div className="flex gap-4">
          {/* Heaver Text Box Wrapper */}
          <div className="flex-1 border border-gray-600 p-4 rounded-md">
            <button
              onClick={createSharkintax}
              className="mb-3 px-4 py-2 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              1 - Create Sharkintax from Gigmark Rows
            </button>
            <h4 
              className="text-black font-bold mb-2"
              style={{ fontSize: '16px' }}
            >
              heaver_text_box
            </h4>
            <textarea
              value={sharkintaxOutput}
              readOnly
              className="w-full h-32 p-3 border border-gray-300 rounded-md bg-gray-50 font-mono text-sm resize-y"
              placeholder="Sharkintax output will appear here..."
            />
            <div className="mt-2 flex gap-2 flex-wrap">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(sharkintaxOutput || '');
                  setAnchorFeedback('📋 All content copied to clipboard!');
                  setTimeout(() => setAnchorFeedback(''), 3000);
                }}
                className="px-3 py-1 bg-gray-600 text-white text-sm font-medium rounded-md hover:bg-gray-700"
              >
                copy all
              </button>
              <button
                onClick={() => {
                  // Split content at unmatched units section and copy only before it
                  const beforeUnmatched = sharkintaxOutput.split('######################################')[0] || '';
                  navigator.clipboard.writeText(beforeUnmatched);
                  setAnchorFeedback('📋 Content before unmatched units copied to clipboard!');
                  setTimeout(() => setAnchorFeedback(''), 3000);
                }}
                className="px-3 py-1 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
              >
                copy all before unmatched units
              </button>
              <button
                onClick={() => {
                  // Extract only unmatched units section
                  const parts = sharkintaxOutput.split('######################################');
                  const unmatchedSection = parts.length > 1 ? '######################################' + parts[1] : '';
                  navigator.clipboard.writeText(unmatchedSection);
                  setAnchorFeedback('📋 Unmatched units copied to clipboard!');
                  setTimeout(() => setAnchorFeedback(''), 3000);
                }}
                className="px-3 py-1 bg-orange-600 text-white text-sm font-medium rounded-md hover:bg-orange-700"
              >
                copy unmatched units only
              </button>
            </div>
          </div>
          
          {/* Raiser System Wrapper */}
          <div className="flex-1 border border-gray-600 p-4 rounded-md">
            <div className="flex gap-4">
              {/* Raiser Text Box */}
              <div className="flex-1">
                <div className="flex items-center gap-3 border border-gray-600 p-2 rounded-md mb-3">
                  <select
                    value={presetGigSelection}
                    onChange={(e) => setPresetGigSelection(Number(e.target.value))}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Gig</option>
                    <option value={1}>1 - citationexpert - citations</option>
                    <option value={2}>2 - se0linkbuilders - social profiles</option>
                  </select>
                  <button
                    onClick={orderItemsAccordingToPreset}
                    disabled={!isOrderButtonEnabled()}
                    className={`px-4 py-2 font-medium rounded-md focus:outline-none focus:ring-2 ${
                      isOrderButtonEnabled() 
                        ? 'bg-purple-600 text-white hover:bg-purple-700 focus:ring-purple-500' 
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    2 - Order Items According To Preset
                  </button>
                </div>
                <h4 
                  className="text-black font-bold mb-2"
                  style={{ fontSize: '16px' }}
                >
                  raiser_text_box
                </h4>
                <textarea
                  value={raiserOutput}
                  readOnly
                  className="w-full h-32 p-3 border border-gray-300 rounded-md bg-gray-50 font-mono text-sm resize-y"
                  placeholder="Ordered units will appear here..."
                />
                <div className="mt-2 flex gap-2 flex-wrap">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(raiserOutput || '');
                      setAnchorFeedback('📋 All content copied to clipboard!');
                      setTimeout(() => setAnchorFeedback(''), 3000);
                    }}
                    className="px-3 py-1 bg-gray-600 text-white text-sm font-medium rounded-md hover:bg-gray-700"
                  >
                    copy all
                  </button>
                  <button
                    onClick={() => {
                      // Split content at unmatched units section and copy only before it
                      const beforeUnmatched = raiserOutput.split('######################################')[0] || '';
                      navigator.clipboard.writeText(beforeUnmatched);
                      setAnchorFeedback('📋 Content before unmatched units copied to clipboard!');
                      setTimeout(() => setAnchorFeedback(''), 3000);
                    }}
                    className="px-3 py-1 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
                  >
                    copy all before unmatched units
                  </button>
                  <button
                    onClick={() => {
                      // Extract only unmatched units section
                      const parts = raiserOutput.split('######################################');
                      const unmatchedSection = parts.length > 1 ? '######################################' + parts[1] : '';
                      navigator.clipboard.writeText(unmatchedSection);
                      setAnchorFeedback('📋 Unmatched units copied to clipboard!');
                      setTimeout(() => setAnchorFeedback(''), 3000);
                    }}
                    className="px-3 py-1 bg-orange-600 text-white text-sm font-medium rounded-md hover:bg-orange-700"
                  >
                    copy unmatched units only
                  </button>
                </div>
              </div>

              {/* Detected URLs/Domains Section */}
              <div className="w-64">
                <h4 
                  className="text-black font-bold mb-2"
                  style={{ fontSize: '16px' }}
                >
                  detected urls/domains
                </h4>
                <div className="border border-gray-300 rounded-md">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border-b border-gray-300 p-2 text-left font-medium">(c)</th>
                        <th className="border-b border-gray-300 p-2 text-left font-medium">url/domain</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detectedUrls.length > 0 ? (
                        detectedUrls.map((url, index) => (
                          <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="border-b border-gray-200 p-2">
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(url);
                                  setAnchorFeedback('📋 URL copied to clipboard!');
                                  setTimeout(() => setAnchorFeedback(''), 3000);
                                }}
                                className="px-2 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600"
                              >
                                copy
                              </button>
                            </td>
                            <td className="border-b border-gray-200 p-2 break-all" style={{ maxWidth: '200px', wordWrap: 'break-word' }}>
                              {url}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={2} className="p-4 text-center text-gray-500 italic">
                            No URLs detected yet
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <div className="mb-4">
          <p className="text-gray-600 text-sm mb-3">
            💡 Paste data directly into cells. The spreadsheet will automatically expand as needed. Begin important cells in Column A with text of "gigmark" and place the unit label after the text of "// ".
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={anchorColumnA}
              className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Anchor Column A
            </button>
            <button
              onClick={() => setShowConfirmDialog(true)}
              className="px-4 py-2 bg-red-600 text-white font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              Clear All Data
            </button>
            <button
              onClick={() => {
                // Clear spreadsheet columns B, C, D but keep column A
                const newRows = rows.map(row => ({
                  A: row.A, // Keep column A
                  B: '',    // Clear column B
                  C: '',    // Clear column C
                  D: ''     // Clear column D
                }));
                setRows(newRows);
                // Clear text box outputs
                setSharkintaxOutput('');
                setRaiserOutput('');
                
                setAnchorFeedback('🗑️ All data cleared except Column A!');
                setTimeout(() => setAnchorFeedback(''), 3000);
              }}
              className="px-4 py-2 bg-orange-600 text-white font-medium rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              clear all data (except for column a)
            </button>
            {anchorFeedback && (
              <span className={`text-sm font-medium ${
                anchorFeedback.includes('✅') ? 'text-green-600' : 
                anchorFeedback.includes('⚠️') ? 'text-yellow-600' :
                anchorFeedback.includes('📋') ? 'text-blue-600' :
                'text-gray-600'
              }`}>
                {anchorFeedback}
              </span>
            )}
          </div>
        </div>
        
        {/* Spreadsheet Container */}
        <div className="border border-gray-300 rounded-lg overflow-hidden">
          <div 
            className="overflow-auto" 
            style={{ maxHeight: '600px' }}
          >
            <table className="border-collapse w-full">
              <thead className="sticky top-0 bg-gray-100 z-10">
                <tr>
                  <th className="border border-gray-400 bg-gray-100 p-2 w-16 font-medium">#</th>
                  <th className="border border-gray-400 bg-gray-100 p-2 font-medium" style={{ minWidth: '200px', borderRight: '3px solid black' }}>A</th>
                  <th className="border border-gray-400 bg-gray-100 p-2 font-medium" style={{ minWidth: '200px' }}>B</th>
                  <th className="border border-gray-400 bg-gray-100 p-2 font-medium" style={{ minWidth: '200px' }}>C</th>
                  <th className="border border-gray-400 bg-gray-100 p-2 font-medium" style={{ minWidth: '200px' }}>D</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    <td className="border border-gray-400 bg-gray-50 p-1 text-center text-sm font-medium">
                      {rowIndex + 1}
                    </td>
                    {['A', 'B', 'C', 'D'].map((column) => (
                      <td 
                        key={`${rowIndex}-${column}`} 
                        className="border border-gray-400 p-0"
                        style={column === 'A' ? { borderRight: '3px solid black' } : {}}
                      >
                        <input
                          type="text"
                          value={row[column as keyof typeof row]}
                          onChange={(e) => handleCellChange(rowIndex, column, e.target.value)}
                          onPaste={(e) => handlePaste(e, rowIndex, column)}
                          className="w-full h-full p-2 border-0 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset bg-transparent"
                          style={{ minHeight: '40px' }}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="mt-4 text-sm text-gray-500">
          <p>Current rows: {rows.length}</p>
          <p className="mt-1">📊 Supports tab-separated and newline-separated data pasting</p>
          <p className="mt-1">💾 Column A data is automatically saved when anchored</p>
        </div>
      </div>
    </>
  );

  const renderGigAtlasMapping = () => {
    const selectedGig = gigData.find(gig => gig.gig_ref_id === selectedGigId);
    
    return (
      <div className="flex gap-6 h-full">
        {/* Left Sidebar - Gig Table */}
        <div className="w-1/2">
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Gig Atlas Mapping Presets</h2>
            <div className="overflow-x-auto">
              <table className="border-collapse border border-gray-400 w-full text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-400 p-2 font-medium">gig_ref_id</th>
                    <th className="border border-gray-400 p-2 font-medium">service type</th>
                    <th className="border border-gray-400 p-2 font-medium">gig link</th>
                    <th className="border border-gray-400 p-2 font-medium">qty properties</th>
                    <th className="border border-gray-400 p-2 font-medium">price</th>
                    <th className="border border-gray-400 p-2 font-medium">seller link</th>
                    <th className="border border-gray-400 p-2 font-medium">units</th>
                  </tr>
                </thead>
                <tbody>
                  {gigData.map((gig) => (
                    <tr 
                      key={gig.gig_ref_id}
                      className={`cursor-pointer hover:bg-blue-50 ${
                        selectedGigId === gig.gig_ref_id ? 'bg-blue-100' : ''
                      }`}
                      onClick={() => setSelectedGigId(gig.gig_ref_id)}
                    >
                      <td className="border border-gray-400 p-2 text-center font-medium">
                        {gig.gig_ref_id}
                      </td>
                      <td className="border border-gray-400 p-2">
                        {gig.service_type}
                      </td>
                      <td className="border border-gray-400 p-2 max-w-xs">
                        <div className="truncate">
                          <a 
                            href={gig.gig_link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {gig.gig_link}
                          </a>
                        </div>
                      </td>
                      <td className="border border-gray-400 p-2 text-center">
                        {gig.qty_properties}
                      </td>
                      <td className="border border-gray-400 p-2 text-center font-medium">
                        {gig.price}
                      </td>
                      <td className="border border-gray-400 p-2">
                        <a 
                          href={gig.seller_link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline truncate block"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {gig.seller_link}
                        </a>
                      </td>
                      <td className="border border-gray-400 p-2 text-center font-medium">
                        {gig.atlas_data_plain.split('\n').filter(line => line.trim() !== '').length}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Viewer Pane */}
        <div className="w-1/2">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 
              className="text-black font-bold mb-4"
              style={{ fontSize: '16px' }}
            >
              Atlas Mapping Datum - unit labels
            </h3>
            
            {/* Atlas View Tabs */}
            <div className="mb-4">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                  <button
                    onClick={() => setAtlasViewTab(1)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      atlasViewTab === 1
                        ? 'border-green-500 text-green-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    1 - Plain Version
                  </button>
                  <button
                    onClick={() => setAtlasViewTab(2)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      atlasViewTab === 2
                        ? 'border-green-500 text-green-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    2 - Sharkintax Version
                  </button>
                </nav>
              </div>
            </div>

            <textarea
              value={atlasViewTab === 1 ? selectedGig?.atlas_data_plain || '' : selectedGig?.atlas_data_sharkintax || ''}
              readOnly
              className="w-full h-96 p-4 border border-gray-300 rounded-md bg-gray-50 font-mono text-sm resize-none"
              placeholder="Select a gig from the table to view its atlas mapping data..."
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6">
        {/* Page Title */}
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Citation Crane</h1>
        
        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab(1)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 1
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                1 - Main Screen
              </button>
              <button
                onClick={() => setActiveTab(2)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 2
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                2 - Gig Atlas Mapping Presets
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 1 && renderMainScreen()}
        {activeTab === 2 && renderGigAtlasMapping()}
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Confirm Clear All Data</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to clear all data from the spreadsheet? This will also remove any anchored Column A data. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirmDialog(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={clearAllData}
                className="px-4 py-2 bg-red-600 text-white font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                Clear All Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}