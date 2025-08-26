'use client';

export default function Chatdori() {
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm px-3 py-1">
      <div className="flex items-center">
        <span className="text-sm font-bold text-black mr-4">chatdori</span>
        <div className="flex items-center">
          <a
            href="https://chatgpt.com"
            target="_blank"
            rel="noopener noreferrer"
            className="px-2 py-1 text-center bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-l transition-colors -mr-px"
          >
            <span className="text-sm font-medium text-gray-700 hover:text-blue-700">chatgpt</span>
          </a>
          <a
            href="https://claude.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="px-2 py-1 text-center bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 transition-colors -mr-px"
          >
            <span className="text-sm font-medium text-gray-700 hover:text-blue-700">claude</span>
          </a>
          <a
            href="https://grok.com"
            target="_blank"
            rel="noopener noreferrer"
            className="px-2 py-1 text-center bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 transition-colors -mr-px"
          >
            <span className="text-sm font-medium text-gray-700 hover:text-blue-700">grok</span>
          </a>
          <a
            href="https://gemini.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="px-2 py-1 text-center bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 transition-colors -mr-px"
          >
            <span className="text-sm font-medium text-gray-700 hover:text-blue-700">gemini</span>
          </a>
          <a
            href="https://www.perplexity.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="px-2 py-1 text-center bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-r transition-colors"
          >
            <span className="text-sm font-medium text-gray-700 hover:text-blue-700">perplexity</span>
          </a>
        </div>
      </div>
    </div>
  );
}