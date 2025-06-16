'use client';

import { Tebnar2ThrottleSettings } from '../types/tebnar2-types';
import { TBN2_AI_MODELS } from '../constants/tebnar2-constants';

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
  onPresetLoad
}: Tebnar2ActionsProps) {
  return (
    <div className="w-full bg-gray-50 border-b border-gray-200 p-4">
      <div className="flex flex-wrap items-center gap-4">
        {/* Quantity per plan */}
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700">Qty per plan:</label>
          <input
            type="number"
            value={qtyPerPlan}
            onChange={(e) => onQtyPerPlanChange(parseInt(e.target.value) || 1)}
            min="1"
            max="10"
            className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
          />
        </div>

        {/* AI Model selection */}
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700">AI Model:</label>
          <select
            value={aiModel}
            onChange={(e) => onAiModelChange(e.target.value)}
            className="px-2 py-1 border border-gray-300 rounded text-sm"
          >
            {TBN2_AI_MODELS.map(model => (
              <option key={model} value={model}>{model}</option>
            ))}
          </select>
        </div>

        {/* Generate ZIP checkbox */}
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="tbn2-generateZip"
            checked={generateZip}
            onChange={(e) => onGenerateZipChange(e.target.checked)}
            className="rounded"
          />
          <label htmlFor="tbn2-generateZip" className="text-sm font-medium text-gray-700">
            Generate ZIP
          </label>
        </div>

        {/* Wipe Meta checkbox */}
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="tbn2-wipeMeta"
            checked={wipeMeta}
            onChange={(e) => onWipeMetaChange(e.target.checked)}
            className="rounded"
          />
          <label htmlFor="tbn2-wipeMeta" className="text-sm font-medium text-gray-700">
            Wipe Meta
          </label>
        </div>

        {/* Throttle settings */}
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="tbn2-throttle"
            checked={throttle1.enabled}
            onChange={(e) => onThrottle1Change({
              ...throttle1,
              enabled: e.target.checked
            })}
            className="rounded"
          />
          <label htmlFor="tbn2-throttle" className="text-sm font-medium text-gray-700">
            Throttle
          </label>
          {throttle1.enabled && (
            <div className="flex items-center space-x-1">
              <input
                type="number"
                value={throttle1.delayBetweenImages}
                onChange={(e) => onThrottle1Change({
                  ...throttle1,
                  delayBetweenImages: parseInt(e.target.value) || 3000
                })}
                min="1000"
                max="30000"
                step="1000"
                className="w-20 px-1 py-1 border border-gray-300 rounded text-xs"
                placeholder="3000"
              />
              <span className="text-xs text-gray-500">ms</span>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center space-x-2 ml-auto">
          <button
            onClick={onPresetLoad}
            disabled={loadingPreset}
            className="px-3 py-1 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-300 text-white text-sm rounded transition-colors"
          >
            {loadingPreset ? 'Loading...' : 'Load Preset'}
          </button>

          <button
            disabled={submitLoading}
            className="px-4 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm rounded transition-colors"
          >
            {submitLoading ? 'Processing...' : 'Create Plans'}
          </button>

          <button
            disabled={makeImagesLoading}
            className="px-4 py-1 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white text-sm rounded transition-colors"
          >
            {makeImagesLoading ? 'Generating...' : 'Make Images'}
          </button>
        </div>
      </div>

      {/* Result messages */}
      {submitResult && (
        <div className="mt-2 text-sm text-gray-600">
          Submit: {submitResult}
        </div>
      )}
      
      {makeImagesResult && (
        <div className="mt-2 text-sm text-gray-600">
          Images: {makeImagesResult}
        </div>
      )}
    </div>
  );
}