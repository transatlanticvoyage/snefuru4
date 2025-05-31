import { ImageRecord } from '../types';

interface Panjar2UIProps {
  images: ImageRecord[];
}

export default function Panjar2UI({ images }: Panjar2UIProps) {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Images Database</h1>
      
      {/* Images Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-4 py-2 border">Image Preview</th>
              <th className="px-4 py-2 border">ID</th>
              <th className="px-4 py-2 border">User ID</th>
              <th className="px-4 py-2 border">Created At</th>
              <th className="px-4 py-2 border">Plan ID</th>
              <th className="px-4 py-2 border">File URL</th>
              <th className="px-4 py-2 border">File Extension</th>
              <th className="px-4 py-2 border">File Size</th>
              <th className="px-4 py-2 border">Width</th>
              <th className="px-4 py-2 border">Height</th>
              <th className="px-4 py-2 border">Prompt</th>
              <th className="px-4 py-2 border">Status</th>
              <th className="px-4 py-2 border">Function Used</th>
            </tr>
          </thead>
          <tbody>
            {images.map((image) => (
              <tr key={image.id} className="hover:bg-gray-50">
                <td className="px-4 py-2 border">
                  {image.img_file_url1 ? (
                    <img 
                      src={image.img_file_url1} 
                      alt="Preview" 
                      className="w-20 h-20 object-cover"
                      onError={(e) => {
                        e.currentTarget.src = 'https://via.placeholder.com/80?text=No+Image';
                      }}
                    />
                  ) : (
                    <div className="w-20 h-20 bg-gray-100 flex items-center justify-center text-gray-400">
                      No Image
                    </div>
                  )}
                </td>
                <td className="px-4 py-2 border">{image.id}</td>
                <td className="px-4 py-2 border">{image.rel_users_id}</td>
                <td className="px-4 py-2 border">{new Date(image.created_at).toLocaleString()}</td>
                <td className="px-4 py-2 border">{image.rel_images_plans_id}</td>
                <td className="px-4 py-2 border">
                  <a 
                    href={image.img_file_url1} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline truncate block max-w-xs"
                  >
                    {image.img_file_url1}
                  </a>
                </td>
                <td className="px-4 py-2 border">{image.img_file_extension}</td>
                <td className="px-4 py-2 border">{image.img_file_size}</td>
                <td className="px-4 py-2 border">{image.width}</td>
                <td className="px-4 py-2 border">{image.height}</td>
                <td className="px-4 py-2 border">
                  <div className="max-w-xs truncate" title={image.prompt1}>
                    {image.prompt1}
                  </div>
                </td>
                <td className="px-4 py-2 border">{image.status}</td>
                <td className="px-4 py-2 border">{image.function_used_to_fetch_the_image}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 