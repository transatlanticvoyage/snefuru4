'use client';

import { useState } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import Link from 'next/link';

interface TextChunk {
  id: string;
  index: number;
  content: string;
  wordCount: number;
  charCount: number;
}

export default function ChopTextPage() {
  const { user } = useAuth();
  const [inputText, setInputText] = useState('');
  const [chunkCount, setChunkCount] = useState(5);
  const [chunks, setChunks] = useState<TextChunk[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async () => {
    if (!inputText.trim()) return;
    
    setIsProcessing(true);
    
    // Split text into roughly equal chunks
    const words = inputText.trim().split(/\s+/);
    const wordsPerChunk = Math.ceil(words.length / chunkCount);
    
    const newChunks: TextChunk[] = [];
    
    for (let i = 0; i < chunkCount; i++) {
      const startIndex = i * wordsPerChunk;
      const endIndex = Math.min(startIndex + wordsPerChunk, words.length);
      const chunkWords = words.slice(startIndex, endIndex);
      const chunkContent = chunkWords.join(' ');
      
      if (chunkContent.trim()) {
        newChunks.push({
          id: `chunk-${i + 1}`,
          index: i + 1,
          content: chunkContent,
          wordCount: chunkWords.length,
          charCount: chunkContent.length
        });
      }
    }
    
    setChunks(newChunks);
    setIsProcessing(false);
  };

  const copyToClipboard = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      // You could add a toast notification here if desired
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleReset = () => {
    setInputText('');
    setChunks([]);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Please log in to access this page.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4">
        <div className="mb-4">
          <Link href="/dashboard" className="text-blue-600 hover:text-blue-800">
            ← Back to Dashboard
          </Link>
        </div>
        
        <h1 className="text-2xl font-bold mb-6">Text Chopper</h1>
        
        {/* Input Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="space-y-4">
            {/* Text Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Paste your large text content:
              </label>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Paste your large text content here (database schemas, documentation, etc.)"
                className="w-full h-48 px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
              />
              {inputText.trim() && (
                <div className="mt-2 text-sm text-gray-600">
                  Current: {inputText.trim().split(/\s+/).length} words, {inputText.length} characters
                </div>
              )}
            </div>

            {/* Settings */}
            <div className="flex items-center gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Number of chunks:
                </label>
                <input
                  type="number"
                  min="2"
                  max="50"
                  value={chunkCount}
                  onChange={(e) => setChunkCount(Math.max(2, parseInt(e.target.value) || 2))}
                  className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex gap-2 mt-6">
                <button
                  onClick={handleSubmit}
                  disabled={!inputText.trim() || isProcessing}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? 'Processing...' : 'Chop Text'}
                </button>
                
                {chunks.length > 0 && (
                  <button
                    onClick={handleReset}
                    className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Results Table */}
        {chunks.length > 0 && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold">Text Chunks ({chunks.length})</h2>
              <p className="text-sm text-gray-600 mt-1">
                Original text divided into {chunks.length} chunks
              </p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">
                      Chunk #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">
                      Word Count
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">
                      Character Count
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">
                      Preview
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {chunks.map((chunk) => (
                    <tr key={chunk.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {chunk.index}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {chunk.wordCount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {chunk.charCount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="max-w-xs truncate">
                          {chunk.content.substring(0, 100)}...
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => copyToClipboard(chunk.content)}
                          className="inline-flex items-center px-3 py-1 border border-blue-300 text-xs font-medium rounded text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
                        >
                          Copy Text
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}