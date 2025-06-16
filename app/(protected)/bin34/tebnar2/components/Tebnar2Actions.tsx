'use client';

import { Tebnar2ThrottleSettings } from '../types/tebnar2-types';

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
      <div className="flex flex-col space-y-4">
        
        {/* Header */}
        <h3 className="text-lg font-medium text-gray-900">
          Actions & Settings
        </h3>

        {/* Settings Row 1 */}
        <div className="flex flex-wrap gap-4 items-center">
          
          {/* Quantity Per Plan */}
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">
              Qty per Plan:
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={qtyPerPlan}
              onChange={(e) => onQtyPerPlanChange(parseInt(e.target.value) || 1)}
              className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
            />
          </div>

          {/* AI Model Selection */}
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">
              AI Model:
            </label>
            <select
              value={aiModel}
              onChange={(e) => onAiModelChange(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded text-sm"
            >
              <option value="openai">OpenAI</option>
              <option value="claude">Claude</option>
              <option value="replicate">Replicate</option>
              <option value="stability">Stability AI</option>
            </select>
          </div>

          {/* Generate ZIP */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="generate-zip"
              checked={generateZip}
              onChange={(e) => onGenerateZipChange(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="generate-zip" className="text-sm font-medium text-gray-700">
              Generate ZIP
            </label>
          </div>

          {/* Wipe Meta */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="wipe-meta"
              checked={wipeMeta}
              onChange={(e) => onWipeMetaChange(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="wipe-meta" className="text-sm font-medium text-gray-700">
              Wipe Meta
            </label>
          </div>
        </div>

        {/* Throttle Settings */}
        <div className="flex flex-wrap gap-4 items-center">
          <span className="text-sm font-medium text-gray-700">Throttle:</span>
          
          <div className="flex items-center space-x-2">
            <label className="text-xs text-gray-600">Delay Between Images:</label>
            <input
              type="number"
              min="0"
              max="10000"
              value={throttle1.delayBetweenImages}
              onChange={(e) => onThrottle1Change({
                ...throttle1,
                delayBetweenImages: parseInt(e.target.value) || 0
              })}
              className="w-20 px-2 py-1 border border-gray-300 rounded text-xs"
            />
          </div>

          <div className="flex items-center space-x-2">
            <label className="text-xs text-gray-600">Delay Between Plans:</label>
            <input
              type="number"
              min="0"
              max="10000"
              value={throttle1.delayBetweenPlans}
              onChange={(e) => onThrottle1Change({
                ...throttle1,
                delayBetweenPlans: parseInt(e.target.value) || 0
              })}
              className="w-20 px-2 py-1 border border-gray-300 rounded text-xs"
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="throttle-enabled"
              checked={throttle1.enabled}
              onChange={(e) => onThrottle1Change({
                ...throttle1,
                enabled: e.target.checked
              })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="throttle-enabled" className="text-xs text-gray-600">
              Enabled
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          
          {/* Preset Load Button */}
          <button
            onClick={onPresetLoad}
            disabled={loadingPreset}
            className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
              loadingPreset
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-purple-600 hover:bg-purple-700 text-white'
            }`}
          >
            {loadingPreset ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Loading...</span>
              </div>
            ) : (
              'Load Preset'
            )}
          </button>

          {/* Submit/Process Button */}
          <button
            disabled={submitLoading}
            className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
              submitLoading
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {submitLoading ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Processing...</span>
              </div>
            ) : (
              'Submit Plans'
            )}
          </button>

          {/* Make Images Button */}
          <button
            disabled={makeImagesLoading}
            className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
              makeImagesLoading
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {makeImagesLoading ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Generating...</span>
              </div>
            ) : (
              'Make Images'
            )}
          </button>
        </div>

        {/* Result Messages */}
        {submitResult && (
          <div className={`p-3 rounded text-sm ${
            submitResult.includes('success') || submitResult.includes('✅')
              ? 'bg-green-100 text-green-800 border border-green-300'
              : 'bg-red-100 text-red-800 border border-red-300'
          }`}>
            {submitResult}
          </div>
        )}

        {makeImagesResult && (
          <div className={`p-3 rounded text-sm ${
            makeImagesResult.includes('success') || makeImagesResult.includes('✅')
              ? 'bg-green-100 text-green-800 border border-green-300'
              : 'bg-red-100 text-red-800 border border-red-300'
          }`}>
            {makeImagesResult}
          </div>
        )}
      </div>
    </div>
  );
}