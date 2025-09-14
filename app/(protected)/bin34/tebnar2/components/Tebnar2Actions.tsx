'use client';

import { useState } from 'react';
import { Tebnar2ThrottleSettings } from '../types/tebnar2-types';
import Tebnar2ExcelPasteGrid from './Tebnar2ExcelPasteGrid';
import { tbn2_func_create_plans_from_xls_2 } from '../utils/tbn2_func_create_plans_from_xls_2';
import { tbn2_func_create_plans_make_images_2 } from '../utils/tbn2_func_create_plans_make_images_2';
import * as XLSX from 'xlsx';

interface Tebnar2ActionsProps {
  qtyPerPlan: number;
  onQtyPerPlanChange: (qty: number) => void;
  aiModel: string;
  onAiModelChange: (model: string) => void;
  generateZip: boolean;
  onGenerateZipChange: (generate: boolean) => void;
  wipeMeta: boolean;
  onWipeMetaChange: (wipe: boolean) => void;
  screenshotImages: boolean;
  onScreenshotImagesChange: (screenshot: boolean) => void;
  alterpro: { enabled: boolean; edgePercentages: { top: string; bottom: string; left: string; right: string; } };
  onAlterproChange: (alterpro: { enabled: boolean; edgePercentages: { top: string; bottom: string; left: string; right: string; } }) => void;
  throttle1: Tebnar2ThrottleSettings;
  onThrottle1Change: (throttle: Tebnar2ThrottleSettings) => void;
  submitLoading: boolean;
  submitResult: string | null;
  makeImagesLoading: boolean;
  makeImagesResult: string | null;
  loadingPreset: boolean;
  onPresetLoad: () => void;
  onPresetLoad2Rows: () => void;
  gridData: string[][];
  onGridDataChange: (grid: string[][]) => void;
  presetData: string[][] | null;
  onSubmitCreatePlans: () => void;
  onSubmitMakeImages: () => void;
}

export default function Tebnar2Actions({
  qtyPerPlan,
  onQtyPerPlanChange,
  aiModel,
  onAiModelChange,
  generateZip,
  onGenerateZipChange,
  wipeMeta,
  onWipeMetaChange,
  screenshotImages,
  onScreenshotImagesChange,
  alterpro,
  onAlterproChange,
  throttle1,
  onThrottle1Change,
  submitLoading,
  submitResult,
  makeImagesLoading,
  makeImagesResult,
  loadingPreset,
  onPresetLoad,
  onPresetLoad2Rows,
  gridData,
  onGridDataChange,
  presetData,
  onSubmitCreatePlans,
  onSubmitMakeImages
}: Tebnar2ActionsProps) {
  const [screenshotSizeAccordionOpen, setScreenshotSizeAccordionOpen] = useState(false);

  // Handle edge percentage changes
  const handleEdgePercentageChange = (edge: string, value: string) => {
    const newEdgePercentages = { ...alterpro.edgePercentages, [edge]: value };
    onAlterproChange({
      ...alterpro,
      edgePercentages: newEdgePercentages
    });
  };

  const handleDownloadDummyData = async () => {
    try {
      const response = await fetch('/api/admin-options/kregno_xls_info_1');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }
      
      const result = await response.json();
      if (result.success && result.data?.json1) {
        const { headers, rows } = result.data.json1;
        
        // Map original column order to new column order for export
        // Original: e_zpf_img_code, e_width, e_height, e_associated_content1, e_file_name1, e_more_instructions1, e_prompt1, e_ai_tool1
        // New:      e_prompt1, e_zpf_img_code, e_width, e_height, e_associated_content1, e_file_name1, e_more_instructions1, e_ai_tool1, [empty]
        
        const originalHeaderMap = headers.reduce((map: Record<string, number>, header: string, index: number) => {
          map[header] = index;
          return map;
        }, {});
        
        // New header order for export
        const newHeaders = ['e_prompt1', 'e_zpf_img_code', 'e_width', 'e_height', 'e_associated_content1', 'e_file_name1', 'e_more_instructions1', 'e_ai_tool1', ''];
        
        // Remap the data rows to match new column order
        const newRows = rows.map((row: string[]) => {
          return newHeaders.map(header => {
            if (header === '') return ''; // Empty column
            const originalIndex = originalHeaderMap[header];
            return originalIndex !== undefined ? row[originalIndex] : '';
          });
        });
        
        // Create a new workbook
        const wb = XLSX.utils.book_new();
        
        // Create worksheet data with new headers as first row and remapped data
        const wsData = [newHeaders, ...newRows];
        
        // Convert array to worksheet
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        
        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(wb, ws, 'Dummy Kregno Data');
        
        // Generate and download the file
        XLSX.writeFile(wb, 'dummy_kregno_xls_info.xlsx');
      } else {
        throw new Error('No data found or invalid format');
      }
    } catch (err) {
      console.error('Error downloading dummy data:', err);
      alert(`Failed to download dummy data: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleClearAllInfo = () => {
    // Clear the grid data by resetting it to empty grid structure (11 rows x 9 cols)
    const emptyGrid = Array.from({ length: 11 }, () => Array(9).fill(''));
    onGridDataChange(emptyGrid);
  };

  return (
    <div className="w-full px-4">
      {/* Preset Data Button - positioned above kzelement6 - exact clone from tebnar1 */}
      <div className="mb-4 flex gap-2">
        <button
          onClick={onPresetLoad}
          disabled={loadingPreset}
          className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {loadingPreset ? 'Loading...' : 'use dummy kregno xls info 1'}
        </button>
        <button
          onClick={onPresetLoad2Rows}
          disabled={loadingPreset}
          className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {loadingPreset ? 'Loading...' : '2 rows only (random)'}
        </button>
        <button
          onClick={handleDownloadDummyData}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 font-medium"
        >
          download dummy kregno xls info
        </button>
        <button
          onClick={handleClearAllInfo}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 font-medium"
        >
          clear all info
        </button>
      </div>

      {/* ExcelPasteGrid component - exact clone from tebnar1 */}
      <Tebnar2ExcelPasteGrid onGridDataChange={onGridDataChange} presetData={presetData} gridData={gridData} />

      <hr className="my-6 border-t-2 border-gray-300" />

      {/* OPTION 1: Submit func_create_plans_from_xls_1 button - exact clone from tebnar1 */}
      <div className="my-4">
        <div className="font-bold mb-1">Option 1</div>
        <button
          className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
          onClick={onSubmitCreatePlans}
          disabled={submitLoading}
        >
          {submitLoading ? 'Submitting...' : 'Submit tbn2_func_create_plans_from_xls_2'}
        </button>
        {submitResult && <div className="mt-2 text-sm text-gray-700">{submitResult}</div>}
      </div>

      <hr className="my-6 border-t-2 border-gray-300" />

      {/* OPTION 2: QTY selector and Submit func_create_plans_make_images_1 button - exact clone from tebnar1 */}
      <div className="mb-4">
        <div className="font-bold mb-2">Option 2</div>
        <div className="font-bold mb-2">QTY Of Images Per Plan To Generate</div>
        <div className="flex space-x-2 mb-2">
          {[1, 2, 3, 4].map(opt => (
            <button
              key={opt}
              type="button"
              onClick={() => onQtyPerPlanChange(opt)}
              className={`px-4 py-2 rounded-full border font-bold transition-colors duration-150 ${qtyPerPlan === opt ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-800 hover:bg-indigo-100'}`}
            >
              {opt}
            </button>
          ))}
        </div>

        {/* AI Model Selector - exact clone from tebnar1 */}
        <div className="font-bold mb-2">Select AI Model To Use</div>
        <div className="flex space-x-2 mb-2">
          {['openai', 'grok', 'gemini'].map(model => (
            <button
              key={model}
              type="button"
              onClick={() => onAiModelChange(model)}
              className={`px-4 py-2 rounded-full border font-bold transition-colors duration-150 capitalize ${aiModel === model ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-800 hover:bg-teal-100'}`}
            >
              {model}
            </button>
          ))}
        </div>

        {/* Generate Zip Checkbox - exact clone from tebnar1 */}
        <div className="flex items-center mb-2">
          <input
            id="generate-zip"
            type="checkbox"
            checked={generateZip}
            onChange={e => onGenerateZipChange(e.target.checked)}
            className="mr-2"
          />
          <label htmlFor="generate-zip" className="text-sm font-medium">Generate .zip file inside the main folder</label>
        </div>

        {/* Wipe Meta Checkbox - exact clone from tebnar1 */}
        <div className="flex items-center mb-2">
          <input
            id="wipe-meta"
            type="checkbox"
            checked={wipeMeta}
            onChange={e => onWipeMetaChange(e.target.checked)}
            className="mr-2"
          />
          <label htmlFor="wipe-meta" className="text-sm font-medium">Wipe all meta data from images</label>
        </div>

        <hr className="my-4 border-t border-gray-300" />

        {/* Screenshot Images Checkbox */}
        <div className="flex items-center mb-2">
          <input
            id="screenshot-images"
            type="checkbox"
            checked={screenshotImages}
            onChange={e => onScreenshotImagesChange(e.target.checked)}
            className="mr-2"
          />
          <label htmlFor="screenshot-images" className="text-sm font-medium">Screenshot images</label>
        </div>

        <hr className="my-4 border-t border-gray-300" />

        {/* Screenshot Size Alterpro Option - only show if screenshot images is checked */}
        {screenshotImages && (
          <div className="mb-4">
            <div className="flex items-center mb-2">
              <input
                id="alterpro-enabled"
                type="checkbox"
                checked={alterpro.enabled}
                onChange={e => onAlterproChange({ ...alterpro, enabled: e.target.checked })}
                className="mr-2"
              />
              <label htmlFor="alterpro-enabled" className="text-sm font-medium">Use "screenshot size alterpro"</label>
            </div>
            
            <div className="mb-2">
              <button
                onClick={() => setScreenshotSizeAccordionOpen(!screenshotSizeAccordionOpen)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-1 rounded border text-sm font-medium transition-colors duration-150"
              >
                {screenshotSizeAccordionOpen ? 'collapse options' : 'expand options'}
              </button>
            </div>
            
            {screenshotSizeAccordionOpen && (
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="text-xs text-gray-600 mb-3">
                  Configure edge clipping percentages for downsized screenshot selection:
                </div>
                <table className="w-full border-collapse border border-gray-300 text-sm">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 px-3 py-2 text-left font-medium">Edge</th>
                      <th className="border border-gray-300 px-3 py-2 text-left font-medium">Percentage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(alterpro.edgePercentages).map(([edge, percentage]) => (
                      <tr key={edge}>
                        <td className="border border-gray-300 px-3 py-2 capitalize">{edge}</td>
                        <td className="border border-gray-300 px-3 py-2">
                          <input
                            type="text"
                            value={percentage}
                            onChange={(e) => handleEdgePercentageChange(edge, e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="1-5%"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        <hr className="my-4 border-t border-gray-300" />
        
        {/* Throttle1 Controls - exact clone from tebnar1 */}
        <div className="border-t border-gray-200 pt-4 mt-4">
          <div className="flex items-center mb-3">
            <input
              id="throttle1-enabled"
              type="checkbox"
              checked={throttle1.enabled}
              onChange={e => onThrottle1Change({ ...throttle1, enabled: e.target.checked })}
              className="mr-2"
            />
            <label htmlFor="throttle1-enabled" className="text-sm font-medium text-blue-700">
              🐌 Enable Throttle1 (Slow down API requests to prevent timeouts)
            </label>
          </div>
          
          {throttle1.enabled && (
            <div className="ml-6 space-y-3 bg-blue-50 p-3 rounded-lg">
              <div className="flex items-center space-x-4">
                <label className="text-sm font-medium text-gray-700 min-w-[140px]">
                  Delay between images:
                </label>
                <input
                  type="number"
                  value={throttle1.delayBetweenImages}
                  onChange={e => onThrottle1Change({ ...throttle1, delayBetweenImages: Number(e.target.value) })}
                  className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                  min="1000"
                  max="30000"
                  step="500"
                />
                <span className="text-sm text-gray-500">ms ({(throttle1.delayBetweenImages / 1000).toFixed(1)}s)</span>
              </div>
              
              <div className="flex items-center space-x-4">
                <label className="text-sm font-medium text-gray-700 min-w-[140px]">
                  Delay between plans:
                </label>
                <input
                  type="number"
                  value={throttle1.delayBetweenPlans}
                  onChange={e => onThrottle1Change({ ...throttle1, delayBetweenPlans: Number(e.target.value) })}
                  className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                  min="500"
                  max="10000"
                  step="250"
                />
                <span className="text-sm text-gray-500">ms ({(throttle1.delayBetweenPlans / 1000).toFixed(1)}s)</span>
              </div>
              
              <div className="text-xs text-gray-600 mt-2">
                💡 Recommended: 3-5 seconds between images, 1-2 seconds between plans. Higher values reduce API timeouts but take longer.
              </div>
            </div>
          )}
        </div>

        <button
          className="bg-teal-600 text-white px-4 py-2 rounded hover:bg-teal-700"
          onClick={onSubmitMakeImages}
          disabled={makeImagesLoading}
        >
          {makeImagesLoading ? 'Generating Images...' : 'Submit tbn2_func_create_plans_make_images_2'}
        </button>

        {makeImagesResult && (
          <div className="mt-2 text-sm">
            <div className={makeImagesResult.includes('🚀') ? 'text-blue-700' : 'text-gray-700'}>
              {makeImagesResult}
            </div>
            {makeImagesLoading && (
              <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded">
                <div className="text-sm text-blue-800">
                  <strong>💡 Debug Tips:</strong>
                  <ul className="mt-1 ml-4 list-disc text-xs">
                    <li>Go to <strong>bin35/statusbox1</strong> to see real-time logs</li>
                    <li>Filter by "image_generation" or "throttle_system" category</li>
                    <li>Watch for timeout errors or OpenAI API failures</li>
                    <li>Each image generation step is logged with details</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <hr className="my-6 border-t-2 border-gray-300" />
    </div>
  );
}