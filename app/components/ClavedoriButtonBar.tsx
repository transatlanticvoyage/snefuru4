'use client';

import Link from 'next/link';

export default function ClavedoriButtonBar() {
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm px-3 py-1">
      <div className="flex items-center">
        <span className="text-sm font-bold text-black mr-4">clavedori</span>
        <div className="flex items-center">
          <Link
            href="/fabric"
            className="px-2 py-1 text-center bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-l transition-colors -mr-px"
          >
            <span className="text-sm font-medium text-gray-700 hover:text-blue-700">/fabric</span>
          </Link>
          <Link
            href="/kwjar"
            className="px-2 py-1 text-center bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 transition-colors -mr-px"
          >
            <span className="text-sm font-medium text-gray-700 hover:text-blue-700">/kwjar</span>
          </Link>
          <Link
            href="/dfs_fetch_reports"
            className="px-2 py-1 text-center bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-r transition-colors"
          >
            <span className="text-sm font-medium text-gray-700 hover:text-blue-700">/dfs_fetch_reports</span>
          </Link>
        </div>
      </div>
    </div>
  );
}