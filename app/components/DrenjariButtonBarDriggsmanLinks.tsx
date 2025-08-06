'use client';

import Link from 'next/link';

export default function DrenjariButtonBarDriggsmanLinks() {
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm px-3 py-1 mb-4">
      <div className="flex items-center">
        <span className="text-sm font-bold text-black mr-4">drenjari</span>
        <div className="flex items-center">
          <Link
            href="/driggsman"
            className="px-2 py-1 text-center bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-l transition-colors -mr-px"
          >
            <span className="text-sm font-medium text-gray-700 hover:text-blue-700">/driggsman</span>
          </Link>
          <Link
            href="/cgigjar"
            className="px-2 py-1 text-center bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 transition-colors -mr-px"
          >
            <span className="text-sm font-medium text-gray-700 hover:text-blue-700">/cgigjar</span>
          </Link>
          <Link
            href="/callplatjar"
            className="px-2 py-1 text-center bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 transition-colors -mr-px"
          >
            <span className="text-sm font-medium text-gray-700 hover:text-blue-700">/callplatjar</span>
          </Link>
          <Link
            href="/aspejar"
            className="px-2 py-1 text-center bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 transition-colors -mr-px"
          >
            <span className="text-sm font-medium text-gray-700 hover:text-blue-700">/aspejar</span>
          </Link>
          <Link
            href="/cityjar"
            className="px-2 py-1 text-center bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 transition-colors -mr-px"
          >
            <span className="text-sm font-medium text-gray-700 hover:text-blue-700">/cityjar</span>
          </Link>
          <Link
            href="/indusjar"
            className="px-2 py-1 text-center bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 transition-colors -mr-px"
          >
            <span className="text-sm font-medium text-gray-700 hover:text-blue-700">/indusjar</span>
          </Link>
          <Link
            href="/metrojar"
            className="px-2 py-1 text-center bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-r transition-colors"
          >
            <span className="text-sm font-medium text-gray-700 hover:text-blue-700">/metrojar</span>
          </Link>
        </div>
      </div>
    </div>
  );
}