'use client';

import Link from 'next/link';

export default function MenjariButtonBarFileGunLinks() {
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm px-3 py-1 mb-0">
      <div className="flex items-center">
        <span className="text-sm font-bold text-black mr-4">menjari</span>
        <div className="flex items-center">
          <Link
            href="/admin/filegun"
            className="px-2 py-1 text-center bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-l transition-colors -mr-px"
          >
            <span className="text-sm font-medium text-gray-700 hover:text-blue-700">/filegun</span>
          </Link>
          <Link
            href="/admin/filejar"
            className="px-2 py-1 text-center bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 transition-colors -mr-px"
          >
            <span className="text-sm font-medium text-gray-700 hover:text-blue-700">/filejar</span>
          </Link>
          <Link
            href="/admin/folderjar"
            className="px-2 py-1 text-center bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 transition-colors -mr-px"
          >
            <span className="text-sm font-medium text-gray-700 hover:text-blue-700">/folderjar</span>
          </Link>
          <Link
            href="/admin/fobjectjar"
            className="px-2 py-1 text-center bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-r transition-colors"
          >
            <span className="text-sm font-medium text-gray-700 hover:text-blue-700">/fobjectjar</span>
          </Link>
        </div>
      </div>
    </div>
  );
}