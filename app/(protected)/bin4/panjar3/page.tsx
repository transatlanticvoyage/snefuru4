'use client';

import { useState } from 'react';

// Dummy image record type for interface
interface ImageRecord {
  id: string;
  rel_users_id: string;
  created_at: string;
  rel_images_plans_id: string;
  img_file_url1?: string;
  img_file_extension?: string;
  img_file_size?: string;
  width?: number;
  height?: number;
  prompt1?: string;
  status?: string;
  function_used_to_fetch_the_image?: string;
}

export default function Panjar3Page() {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [images] = useState<ImageRecord[]>([]); // No active functionality

  const handleGenerate = () => {
    // No active functionality
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter your prompt here"
          className="w-[400px] h-[150px] p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
        <div className="mt-4">
          <button
            onClick={handleGenerate}
            disabled={isLoading || !prompt.trim()}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Generating...' : 'fetch with func_fetch_image_4'}
          </button>
        </div>
        {error && (
          <div className="mt-4">
            <div className="text-red-600">
              {error}
            </div>
            <pre className="mt-2 p-4 bg-gray-100 rounded-lg overflow-auto text-sm">
              {JSON.stringify(error, null, 2)}
            </pre>
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image Preview</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">File URL</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">File Extension</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">File Size</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Width</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Height</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prompt</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Function Used</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {/* No images to show, just interface */}
          </tbody>
        </table>
      </div>
    </div>
  );
} 