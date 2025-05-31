import { useState } from 'react';
import { func_fetch_image_4 } from '@/app/(protected)/bin4/utils/cfunc_fetch_image_4';

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

export default function Panjar3UI() {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [images, setImages] = useState<ImageRecord[]>([]);

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await func_fetch_image_4(prompt);
      if (result.success && result.image) {
        setImages([result.image, ...images]);
        setPrompt('');
      } else {
        setError(result.error || 'Unknown error');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-4 text-3xl font-bold">kzelement5</div>
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
            {images.map((image) => (
              <tr key={image.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  {image.img_file_url1 && (
                    <img 
                      src={image.img_file_url1} 
                      alt="Generated" 
                      className="h-20 w-20 object-cover"
                    />
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{image.id}</td>
                <td className="px-6 py-4 whitespace-nowrap">{image.rel_users_id}</td>
                <td className="px-6 py-4 whitespace-nowrap">{new Date(image.created_at).toLocaleString()}</td>
                <td className="px-6 py-4 whitespace-nowrap">{image.rel_images_plans_id}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {image.img_file_url1 ? (
                    <a 
                      href={image.img_file_url1} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      View Image
                    </a>
                  ) : (
                    <span className="text-gray-400">No URL</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{image.img_file_extension}</td>
                <td className="px-6 py-4 whitespace-nowrap">{image.img_file_size}</td>
                <td className="px-6 py-4 whitespace-nowrap">{image.width}</td>
                <td className="px-6 py-4 whitespace-nowrap">{image.height}</td>
                <td className="px-6 py-4">
                  <div 
                    className="max-w-xs truncate" 
                    title={image.prompt1 || undefined}
                  >
                    {image.prompt1 || 'No prompt'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{image.status}</td>
                <td className="px-6 py-4 whitespace-nowrap">{image.function_used_to_fetch_the_image}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 