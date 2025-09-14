'use client';

import { RefObject } from 'react';

interface TigerBarProps {
  // Basic selection state
  selectedBatchId?: string;
  selectedSitesprenId?: string;
  selectedGconPieceId?: string;
  
  // Batch management
  batches?: any[];
  onBatchChange?: (batchId: string) => void;
  
  // Sitespren management
  sitesprenDropdownOpen?: boolean;
  sitesprenSearchTerm?: string;
  onSitesprenSearchTermChange?: (term: string) => void;
  onSitesprenDropdownOpenChange?: (open: boolean) => void;
  getSelectedSitesprenDisplay?: () => string;
  getFilteredSitesprenOptions?: () => any[];
  onSitesprenSelect?: (id: string, base: string) => void;
  onSitesprenClear?: () => void;
  onSitesprenSave?: () => void;
  sitesprenSaving?: boolean;
  sitesprenDropdownRef?: RefObject<HTMLDivElement>;
  truncateUUID?: (uuid: string) => string;
  fetchGconPieces?: (base: string) => void;
  
  // GCon piece management
  gconPieceDropdownOpen?: boolean;
  gconPieceSearchTerm?: string;
  onGconPieceSearchTermChange?: (term: string) => void;
  onGconPieceDropdownOpenChange?: (open: boolean) => void;
  getSelectedGconPieceDisplay?: () => string;
  getFilteredGconPieceOptions?: () => any[];
  onGconPieceSelect?: (id: string) => void;
  onGconPieceClear?: () => void;
  onGconPieceSave?: () => void;
  gconPieceSaving?: boolean;
  gconPieceDropdownRef?: RefObject<HTMLDivElement>;
  getGconPieceUrls?: () => any;
  
  // Seed URLs
  seedUrlWpEditor?: string;
  seedUrlFrontend?: string;
  onSeedUrlWpEditorChange?: (value: string) => void;
  onSeedUrlFrontendChange?: (value: string) => void;
  onSeedUrlWpEditorSave?: () => void;
  onSeedUrlFrontendSave?: () => void;
  seedUrlSaving?: { wpEditor: boolean; frontend: boolean };
  
  // Styling
  marginRight?: string;
  className?: string;
}

export default function TigerBar({
  selectedBatchId,
  selectedSitesprenId,
  selectedGconPieceId,
  batches = [],
  onBatchChange,
  sitesprenDropdownOpen = false,
  sitesprenSearchTerm = '',
  onSitesprenSearchTermChange,
  onSitesprenDropdownOpenChange,
  getSelectedSitesprenDisplay,
  getFilteredSitesprenOptions,
  onSitesprenSelect,
  onSitesprenClear,
  onSitesprenSave,
  sitesprenSaving = false,
  sitesprenDropdownRef,
  truncateUUID,
  fetchGconPieces,
  gconPieceDropdownOpen = false,
  gconPieceSearchTerm = '',
  onGconPieceSearchTermChange,
  onGconPieceDropdownOpenChange,
  getSelectedGconPieceDisplay,
  getFilteredGconPieceOptions,
  onGconPieceSelect,
  onGconPieceClear,
  onGconPieceSave,
  gconPieceSaving = false,
  gconPieceDropdownRef,
  getGconPieceUrls,
  seedUrlWpEditor = '',
  seedUrlFrontend = '',
  onSeedUrlWpEditorChange,
  onSeedUrlFrontendChange,
  onSeedUrlWpEditorSave,
  onSeedUrlFrontendSave,
  seedUrlSaving = { wpEditor: false, frontend: false },
  marginRight = '260px',
  className = ''
}: TigerBarProps) {
  
  return (
    <div className={`tiger-bar-container ${className}`}>
      {/* uelbar45 section */}
      <div 
        className="flex items-center px-4 flex-shrink-0"
        style={{ 
          marginRight: marginRight,
          backgroundColor: '#f3f4f6',
          color: '#374151',
          borderTop: '1px solid #4a5568',
          borderBottom: '1px solid #4a5568'
        }}
      >
        <span className="font-semibold mr-4">uelbar45</span>
        
        <table style={{ borderCollapse: 'collapse', fontSize: '16px' }}>
          <thead>
            <tr>
              <th style={{ border: '1px solid gray', padding: '0' }}>
                <div className="cell_inner_wrapper_div">1</div>
              </th>
              <th style={{ border: '1px solid gray', padding: '0' }}>
                <div className="cell_inner_wrapper_div">2</div>
              </th>
              <th style={{ border: '1px solid gray', padding: '0' }}>
                <div className="cell_inner_wrapper_div">rel_images_plans_batches_id</div>
              </th>
              <th style={{ border: '1px solid gray', padding: '0' }}>
                <div className="cell_inner_wrapper_div">4</div>
              </th>
              <th style={{ border: '1px solid gray', padding: '0' }}>
                <div className="cell_inner_wrapper_div">asn_sitespren_id</div>
              </th>
              <th style={{ border: '1px solid gray', padding: '0' }}>
                <div className="cell_inner_wrapper_div">asn_gcon_piece_id</div>
              </th>
              <th style={{ border: '1px solid gray', padding: '0' }}>
                <div className="cell_inner_wrapper_div">7</div>
              </th>
              <th style={{ border: '1px solid gray', padding: '0' }}>
                <div className="cell_inner_wrapper_div">8</div>
              </th>
              <th style={{ border: '1px solid gray', padding: '0' }}>
                <div className="cell_inner_wrapper_div">9</div>
              </th>
              <th style={{ border: '1px solid gray', padding: '0' }}>
                <div className="cell_inner_wrapper_div">10</div>
              </th>
            </tr>
          </thead>
          <tbody>
            {/* First data row */}
            <tr>
              <td style={{ border: '1px solid gray', padding: '0' }}>
                <div className="cell_inner_wrapper_div">-</div>
              </td>
              <td style={{ border: '1px solid gray', padding: '0' }}>
                <div className="cell_inner_wrapper_div">-</div>
              </td>
              <td style={{ border: '1px solid gray', padding: '0' }}>
                <div className="cell_inner_wrapper_div">
                  <div className="flex items-center space-x-2">
                    <select
                      value={selectedBatchId || ''}
                      onChange={e => onBatchChange?.(e.target.value)}
                      className={`h-7 px-2 rounded text-black ${selectedBatchId ? 'bg-teal-200' : 'bg-white'}`}
                      style={{ minWidth: 120, fontSize: '14px' }}
                    >
                      <option value="">All Batches ({batches.length})</option>
                      {batches.map(batch => (
                        <option key={batch.id} value={batch.id}>{batch.id}</option>
                      ))}
                    </select>
                    
                    {selectedBatchId && (
                      <button
                        onClick={() => {
                          const url = `http://localhost:3000/bin34/tebnar2?batchid=${selectedBatchId}`;
                          window.open(url, '_blank');
                        }}
                        className="h-7 px-3 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs font-medium"
                      >
                        open /tebnar2
                      </button>
                    )}
                  </div>
                </div>
              </td>
              <td style={{ border: '1px solid gray', padding: '0' }}>
                <div className="cell_inner_wrapper_div">-</div>
              </td>
              <td style={{ border: '1px solid gray', padding: '0' }}>
                <div className="cell_inner_wrapper_div">
                  <div className="flex items-center space-x-1">
                    <div className="relative" ref={sitesprenDropdownRef} style={{ width: '410px' }}>
                      <input
                        type="text"
                        value={sitesprenDropdownOpen ? sitesprenSearchTerm : (selectedSitesprenId ? getSelectedSitesprenDisplay?.() || '' : '')}
                        onChange={(e) => onSitesprenSearchTermChange?.(e.target.value)}
                        onFocus={() => {
                          onSitesprenDropdownOpenChange?.(true);
                          onSitesprenSearchTermChange?.('');
                        }}
                        placeholder={!selectedBatchId ? 'Select batch first' : 'Type to search by sitespren_base...'}
                        disabled={!selectedBatchId}
                        className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                        style={{ fontSize: '16px' }}
                      />
                      {sitesprenDropdownOpen && selectedBatchId && (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded shadow-lg max-h-screen overflow-y-auto">
                          {/* Clear/Empty option - always shows first */}
                          <div
                            onClick={() => onSitesprenClear?.()}
                            className="px-2 py-1 hover:bg-red-50 cursor-pointer border-b border-gray-200 bg-red-25"
                            style={{ fontSize: '16px' }}
                          >
                            <span className="text-red-600 font-medium">(update to empty)</span>
                          </div>
                          {getFilteredSitesprenOptions?.().length ? (
                            getFilteredSitesprenOptions?.().map((option) => (
                              <div
                                key={option.id}
                                onClick={() => {
                                  onSitesprenSelect?.(option.id, option.sitespren_base);
                                  fetchGconPieces?.(option.sitespren_base);
                                }}
                                className={`px-2 py-1 hover:bg-blue-50 cursor-pointer ${
                                  option.id === selectedSitesprenId ? 'bg-blue-100' : ''
                                }`}
                                style={{ fontSize: '16px' }}
                              >
                                <span className="text-gray-500">{truncateUUID?.(option.id)}</span> - <span className="text-gray-900">{option.sitespren_base}</span>
                              </div>
                            ))
                          ) : (
                            <div className="px-2 py-1 text-gray-500" style={{ fontSize: '16px' }}>
                              No matches found
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={onSitesprenSave}
                      disabled={!selectedBatchId || sitesprenSaving}
                      className="bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                      style={{ fontSize: '12px' }}
                      title={!selectedBatchId ? 'Select a batch first' : 'Save sitespren assignment'}
                    >
                      {sitesprenSaving ? '...' : 'save'}
                    </button>
                  </div>
                </div>
              </td>
              <td style={{ border: '1px solid gray', padding: '0' }}>
                <div className="cell_inner_wrapper_div">
                  <div className="flex items-center space-x-1">
                    <div className="relative" ref={gconPieceDropdownRef} style={{ width: '370px' }}>
                      <input
                        type="text"
                        value={gconPieceDropdownOpen ? gconPieceSearchTerm : (selectedGconPieceId ? getSelectedGconPieceDisplay?.() || '' : '')}
                        onChange={(e) => onGconPieceSearchTermChange?.(e.target.value)}
                        onFocus={() => {
                          if (!selectedBatchId || !selectedSitesprenId) return;
                          onGconPieceDropdownOpenChange?.(true);
                          onGconPieceSearchTermChange?.('');
                        }}
                        placeholder={!selectedBatchId ? 'Select batch first' : 
                                   !selectedSitesprenId ? 'Select sitespren first' : 
                                   'Type to search by title or pageslug...'}
                        disabled={!selectedBatchId || !selectedSitesprenId}
                        className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                        style={{ fontSize: '16px' }}
                      />
                      {gconPieceDropdownOpen && selectedBatchId && selectedSitesprenId && (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded shadow-lg max-h-screen overflow-y-auto">
                          {/* Clear/Empty option - always shows first */}
                          <div
                            onClick={() => onGconPieceClear?.()}
                            className="px-2 py-1 hover:bg-red-50 cursor-pointer border-b border-gray-200 bg-red-25"
                            style={{ fontSize: '16px' }}
                          >
                            <span className="text-red-600 font-medium">(update to empty)</span>
                          </div>
                          {getFilteredGconPieceOptions?.().length ? (
                            getFilteredGconPieceOptions?.().map((option) => (
                              <div
                                key={option.id}
                                onClick={() => onGconPieceSelect?.(option.id)}
                                className={`px-2 py-1 hover:bg-blue-50 cursor-pointer ${
                                  option.id === selectedGconPieceId ? 'bg-blue-100' : ''
                                }`}
                                style={{ fontSize: '16px' }}
                              >
                                <div className="flex flex-col">
                                  <div>
                                    <span className="text-gray-500">{truncateUUID?.(option.id)}</span> - <span className="text-gray-900 font-medium">{option.meta_title}</span>
                                  </div>
                                  {option.post_name && (
                                    <div className="text-sm text-gray-600 mt-0.5">
                                      pageslug: {option.post_name}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="px-2 py-1 text-gray-500" style={{ fontSize: '16px' }}>
                              No matches found
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={onGconPieceSave}
                      disabled={!selectedBatchId || gconPieceSaving}
                      className="bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                      style={{ fontSize: '12px' }}
                      title={!selectedBatchId ? 'Select a batch first' : 
                             !selectedSitesprenId ? 'Select a sitespren first' :
                             'Save gcon piece assignment'}
                    >
                      {gconPieceSaving ? '...' : 'save'}
                    </button>
                  </div>
                </div>
              </td>
              <td style={{ border: '1px solid gray', padding: '0' }}>
                <div className="cell_inner_wrapper_div">-</div>
              </td>
              <td style={{ border: '1px solid gray', padding: '0' }}>
                <div className="cell_inner_wrapper_div">-</div>
              </td>
              <td style={{ border: '1px solid gray', padding: '0' }}>
                <div className="cell_inner_wrapper_div">-</div>
              </td>
              <td style={{ border: '1px solid gray', padding: '0' }}>
                <div className="cell_inner_wrapper_div">-</div>
              </td>
            </tr>
            
            {/* Second data row */}
            <tr>
              <td style={{ border: '1px solid gray', padding: '0' }}>
                <div className="cell_inner_wrapper_div">-</div>
              </td>
              <td style={{ border: '1px solid gray', padding: '0' }}>
                <div className="cell_inner_wrapper_div">-</div>
              </td>
              <td style={{ border: '1px solid gray', padding: '0' }}>
                <div className="cell_inner_wrapper_div">-</div>
              </td>
              <td style={{ border: '1px solid gray', padding: '0' }}>
                <div className="cell_inner_wrapper_div">-</div>
              </td>
              <td style={{ border: '1px solid gray', padding: '0' }}>
                <div className="cell_inner_wrapper_div">
                  {selectedSitesprenId && (() => {
                    const sitesprenBase = getSelectedSitesprenDisplay?.()?.split(' - ')[1] || '';
                    return sitesprenBase ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => window.open(`https://${sitesprenBase}/wp-admin/`, '_blank')}
                          className="inline-flex items-center justify-center w-8 h-8 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                          title="Open WP Admin"
                        >
                          WP
                        </button>
                        <button
                          onClick={() => window.open(`https://${sitesprenBase}`, '_blank')}
                          className="inline-flex items-center justify-center w-8 h-8 border border-transparent text-xs font-medium rounded text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                          title="Open Site"
                        >
                          Site
                        </button>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(sitesprenBase);
                          }}
                          className="inline-flex items-center justify-center w-8 h-8 border border-transparent text-xs font-medium rounded text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                          title="Copy domain to clipboard"
                        >
                          📋
                        </button>
                        <button
                          onClick={() => window.open(`https://www.google.com/search?q=site%3A${encodeURIComponent(sitesprenBase)}`, '_blank')}
                          className="inline-flex items-center justify-center w-8 h-8 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          title="Google site: search"
                        >
                          G
                        </button>
                      </div>
                    ) : null;
                  })()}
                </div>
              </td>
              <td style={{ border: '1px solid gray', padding: '0' }}>
                <div className="cell_inner_wrapper_div">
                  {selectedGconPieceId && (() => {
                    const urls = getGconPieceUrls?.();
                    return urls ? (
                      <div className="flex space-x-1">
                        <button
                          onClick={() => urls.pendulum && window.open(urls.pendulum, '_blank')}
                          disabled={!urls.pendulum}
                          className="px-2 text-xs font-medium rounded border transition-colors bg-gray-600 text-white border-gray-600 hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                          style={{ height: '20px' }}
                          title="Edit in WordPress admin"
                        >
                          pendulum
                        </button>
                        <button
                          onClick={() => urls.elementor && window.open(urls.elementor, '_blank')}
                          disabled={!urls.elementor}
                          className="px-2 text-xs font-medium rounded border transition-colors bg-purple-600 text-white border-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                          style={{ height: '20px' }}
                          title="Edit with Elementor"
                        >
                          elementor
                        </button>
                        <button
                          onClick={() => urls.frontend && window.open(urls.frontend, '_blank')}
                          disabled={!urls.frontend}
                          className="px-2 text-xs font-medium rounded border transition-colors bg-green-600 text-white border-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                          style={{ height: '20px' }}
                          title="View frontend page"
                        >
                          frontend
                        </button>
                      </div>
                    ) : null;
                  })()}
                </div>
              </td>
              <td style={{ border: '1px solid gray', padding: '0' }}>
                <div className="cell_inner_wrapper_div">-</div>
              </td>
              <td style={{ border: '1px solid gray', padding: '0' }}>
                <div className="cell_inner_wrapper_div">-</div>
              </td>
              <td style={{ border: '1px solid gray', padding: '0' }}>
                <div className="cell_inner_wrapper_div">-</div>
              </td>
              <td style={{ border: '1px solid gray', padding: '0' }}>
                <div className="cell_inner_wrapper_div">-</div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      {/* uelbar50 section */}
      <div 
        className="flex items-center px-4 flex-shrink-0"
        style={{ 
          backgroundColor: '#f3f4f6',
          color: '#374151',
          borderTop: '1px solid #4a5568',
          borderBottom: '1px solid #4a5568',
          marginRight: marginRight
        }}
      >
        <span className="font-semibold mr-4">uelbar50</span>
        
        <table style={{ borderCollapse: 'collapse', fontSize: '16px' }}>
          <thead>
            <tr>
              <th style={{ border: '1px solid gray', padding: '0' }}>
                <div className="cell_inner_wrapper_div">1</div>
              </th>
              <th style={{ border: '1px solid gray', padding: '0' }}>
                <div className="cell_inner_wrapper_div">2</div>
              </th>
              <th style={{ border: '1px solid gray', padding: '0' }}>
                <div className="cell_inner_wrapper_div">seed_url_wp_editor</div>
              </th>
              <th style={{ border: '1px solid gray', padding: '0' }}>
                <div className="cell_inner_wrapper_div">seed_url_frontend</div>
              </th>
              <th style={{ border: '1px solid gray', padding: '0' }}>
                <div className="cell_inner_wrapper_div">5</div>
              </th>
              <th style={{ border: '1px solid gray', padding: '0' }}>
                <div className="cell_inner_wrapper_div">6</div>
              </th>
              <th style={{ border: '1px solid gray', padding: '0' }}>
                <div className="cell_inner_wrapper_div">7</div>
              </th>
              <th style={{ border: '1px solid gray', padding: '0' }}>
                <div className="cell_inner_wrapper_div">8</div>
              </th>
              <th style={{ border: '1px solid gray', padding: '0' }}>
                <div className="cell_inner_wrapper_div">9</div>
              </th>
              <th style={{ border: '1px solid gray', padding: '0' }}>
                <div className="cell_inner_wrapper_div">10</div>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ border: '1px solid gray', padding: '0' }}>
                <div className="cell_inner_wrapper_div">-</div>
              </td>
              <td style={{ border: '1px solid gray', padding: '0' }}>
                <div className="cell_inner_wrapper_div">-</div>
              </td>
              <td style={{ border: '1px solid gray', padding: '0' }}>
                <div className="cell_inner_wrapper_div" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px', minHeight: '40px' }}>
                  <button
                    onClick={() => {
                      if (seedUrlWpEditor && seedUrlWpEditor.trim()) {
                        window.open(seedUrlWpEditor, '_blank');
                      } else {
                        alert('No URL to open');
                      }
                    }}
                    disabled={!seedUrlWpEditor || !seedUrlWpEditor.trim()}
                    className="w-8 h-8 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
                    title="Open WP editor URL in new tab"
                  >
                    🌐
                  </button>
                  <button
                    onClick={() => {
                      if (seedUrlWpEditor && seedUrlWpEditor.trim()) {
                        navigator.clipboard.writeText(seedUrlWpEditor);
                      } else {
                        alert('No URL to copy');
                      }
                    }}
                    disabled={!seedUrlWpEditor || !seedUrlWpEditor.trim()}
                    className="w-8 h-8 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
                    title="Copy WP editor URL to clipboard"
                  >
                    📋
                  </button>
                  <input
                    type="text"
                    value={seedUrlWpEditor}
                    onChange={(e) => onSeedUrlWpEditorChange?.(e.target.value)}
                    placeholder={!selectedBatchId ? 'Select batch first' : 'Enter WP editor URL...'}
                    disabled={!selectedBatchId}
                    className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    style={{ fontSize: '16px', width: '300px' }}
                  />
                  <button
                    onClick={onSeedUrlWpEditorSave}
                    disabled={!selectedBatchId || seedUrlSaving.wpEditor}
                    className="bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    style={{ fontSize: '12px' }}
                    title={!selectedBatchId ? 'Select a batch first' : 'Save WP editor URL'}
                  >
                    {seedUrlSaving.wpEditor ? '...' : 'save'}
                  </button>
                </div>
              </td>
              <td style={{ border: '1px solid gray', padding: '0' }}>
                <div className="cell_inner_wrapper_div" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px', minHeight: '40px' }}>
                  <button
                    onClick={() => {
                      if (seedUrlFrontend && seedUrlFrontend.trim()) {
                        window.open(seedUrlFrontend, '_blank');
                      } else {
                        alert('No URL to open');
                      }
                    }}
                    disabled={!seedUrlFrontend || !seedUrlFrontend.trim()}
                    className="w-8 h-8 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
                    title="Open frontend URL in new tab"
                  >
                    🌐
                  </button>
                  <button
                    onClick={() => {
                      if (seedUrlFrontend && seedUrlFrontend.trim()) {
                        navigator.clipboard.writeText(seedUrlFrontend);
                      } else {
                        alert('No URL to copy');
                      }
                    }}
                    disabled={!seedUrlFrontend || !seedUrlFrontend.trim()}
                    className="w-8 h-8 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
                    title="Copy frontend URL to clipboard"
                  >
                    📋
                  </button>
                  <input
                    type="text"
                    value={seedUrlFrontend}
                    onChange={(e) => onSeedUrlFrontendChange?.(e.target.value)}
                    placeholder={!selectedBatchId ? 'Select batch first' : 'Enter frontend URL...'}
                    disabled={!selectedBatchId}
                    className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    style={{ fontSize: '16px', width: '300px' }}
                  />
                  <button
                    onClick={onSeedUrlFrontendSave}
                    disabled={!selectedBatchId || seedUrlSaving.frontend}
                    className="bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    style={{ fontSize: '12px' }}
                    title={!selectedBatchId ? 'Select a batch first' : 'Save frontend URL'}
                  >
                    {seedUrlSaving.frontend ? '...' : 'save'}
                  </button>
                </div>
              </td>
              <td style={{ border: '1px solid gray', padding: '0' }}>
                <div className="cell_inner_wrapper_div">-</div>
              </td>
              <td style={{ border: '1px solid gray', padding: '0' }}>
                <div className="cell_inner_wrapper_div">-</div>
              </td>
              <td style={{ border: '1px solid gray', padding: '0' }}>
                <div className="cell_inner_wrapper_div">-</div>
              </td>
              <td style={{ border: '1px solid gray', padding: '0' }}>
                <div className="cell_inner_wrapper_div">-</div>
              </td>
              <td style={{ border: '1px solid gray', padding: '0' }}>
                <div className="cell_inner_wrapper_div">-</div>
              </td>
              <td style={{ border: '1px solid gray', padding: '0' }}>
                <div className="cell_inner_wrapper_div">-</div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}