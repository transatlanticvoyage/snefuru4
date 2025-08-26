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
            <div className="flex items-center">
              <img src="/icons/chatgpt.svg" className="w-4 h-4 mr-1" alt="ChatGPT" />
              <span className="text-sm font-medium text-gray-700 hover:text-blue-700">chatgpt</span>
            </div>
          </a>
          <a
            href="https://claude.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="px-2 py-1 text-center bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 transition-colors -mr-px"
          >
            <div className="flex items-center">
              <img src="/icons/claude.ico" className="w-4 h-4 mr-1" alt="Claude" />
              <span className="text-sm font-medium text-gray-700 hover:text-blue-700">claude</span>
            </div>
          </a>
          <a
            href="https://grok.com"
            target="_blank"
            rel="noopener noreferrer"
            className="px-2 py-1 text-center bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 transition-colors -mr-px"
          >
            <div className="flex items-center">
              <img src="/icons/grok.png" className="w-4 h-4 mr-1" alt="Grok" />
              <span className="text-sm font-medium text-gray-700 hover:text-blue-700">grok</span>
            </div>
          </a>
          <a
            href="https://gemini.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="px-2 py-1 text-center bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 transition-colors -mr-px"
          >
            <div className="flex items-center">
              <img src="/icons/gemini.svg" className="w-4 h-4 mr-1" alt="Gemini" />
              <span className="text-sm font-medium text-gray-700 hover:text-blue-700">gemini</span>
            </div>
          </a>
          <a
            href="https://www.perplexity.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="px-2 py-1 text-center bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-r transition-colors"
          >
            <div className="flex items-center">
              <img src="/icons/perplexity.ico" className="w-4 h-4 mr-1" alt="Perplexity" />
              <span className="text-sm font-medium text-gray-700 hover:text-blue-700">perplexity</span>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}