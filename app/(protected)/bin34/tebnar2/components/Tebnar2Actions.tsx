'use client';

import { Tebnar2ThrottleSettings } from '../types/tebnar2-types';
import Tebnar2ExcelPasteGrid from './Tebnar2ExcelPasteGrid';

interface Tebnar2ActionsProps {
  qtyPerPlan: number;
  onQtyPerPlanChange: (qty: number) => void;
  aiModel: string;
  onAiModelChange: (model: string) => void;
  generateZip: boolean;
  onGenerateZipChange: (generate: boolean) => void;
  wipeMeta: boolean;
  onWipeMetaChange: (wipe: boolean) => void;
  throttle1: Tebnar2ThrottleSettings;
  onThrottle1Change: (throttle: Tebnar2ThrottleSettings) => void;
  submitLoading: boolean;
  submitResult: string | null;
  makeImagesLoading: boolean;
  makeImagesResult: string | null;
  loadingPreset: boolean;
  onPresetLoad: () => void;
  gridData: string[][];
  onGridDataChange: (grid: string[][]) => void;
  presetData: string[][] | null;
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
  throttle1,
  onThrottle1Change,
  submitLoading,
  submitResult,
  makeImagesLoading,
  makeImagesResult,
  loadingPreset,
  onPresetLoad,
  gridData,
  onGridDataChange,
  presetData
}: Tebnar2ActionsProps) {

  return (
    <div className="w-full px-4">
      {/* Preset Data Button - positioned above kzelement6 - exact clone from tebnar1 */}
      <div className="mb-4">
        <button
          onClick={onPresetLoad}
          disabled={loadingPreset}
          className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {loadingPreset ? 'Loading...' : 'use dummy kregno xls info 1'}
        </button>
      </div>

      {/* ExcelPasteGrid component - exact clone from tebnar1 */}
      <Tebnar2ExcelPasteGrid onGridDataChange={onGridDataChange} presetData={presetData} />

      <hr className="my-6 border-t-2 border-gray-300" />

      {/* OPTION 1: Submit func_create_plans_from_xls_1 button - exact clone from tebnar1 */}
      <div className="my-4">
        <div className="font-bold mb-1">Option 1</div>
        <button
          className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
          onClick={() => {}}
          disabled={submitLoading}
        >
          {submitLoading ? 'Submitting...' : 'Submit func_create_plans_from_xls_1'}
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
          onClick={() => {}}
          disabled={makeImagesLoading}
        >
          {makeImagesLoading ? 'Generating Images...' : 'Submit func_create_plans_make_images_1'}
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