'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface GiraffeSiteButtonBoxProps {
  sitesprenBase: string;
  siteId?: string;
  onClose?: () => void;
  onScrapeLinks?: (siteId: string, sitesprenBase: string) => void;
  onEditSite?: (siteData: any) => void;
  onToggleExpandedRow?: (siteId: string) => void;
  isScrapingLinks?: boolean;
}

export default function GiraffeSiteButtonBox({ 
  sitesprenBase, 
  siteId,
  onClose,
  onScrapeLinks,
  onEditSite,
  onToggleExpandedRow,
  isScrapingLinks = false
}: GiraffeSiteButtonBoxProps) {
  const [isVisible, setIsVisible] = useState(true);

  const handleClose = () => {
    setIsVisible(false);
    onClose?.();
  };

  if (!isVisible) return null;

  return (
    <div className="p-4 min-w-96">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-800">Site Tools: {sitesprenBase}</h3>
        <button
          onClick={handleClose}
          className="text-gray-400 hover:text-gray-600 focus:outline-none"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {/* Individual View - Full width button */}
        <div className="col-span-4">
          <Link
            href={`/sitnivid?site=${encodeURIComponent(sitesprenBase)}`}
            className="inline-flex items-center justify-center w-full px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Individual View
          </Link>
        </div>

        {/* WP Admin */}
        <button
          onClick={() => window.open(`https://${sitesprenBase}/wp-admin/`, '_blank')}
          className="inline-flex items-center justify-center h-10 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          title="Open WP Admin"
        >
          WP
        </button>

        {/* Open Site */}
        <button
          onClick={() => window.open(`https://${sitesprenBase}`, '_blank')}
          className="inline-flex items-center justify-center h-10 border border-transparent text-xs font-medium rounded text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
          title="Open Site"
        >
          Site
        </button>

        {/* Copy to Clipboard */}
        <button
          onClick={() => {
            navigator.clipboard.writeText(sitesprenBase);
            // Optional: You could add a toast notification here
          }}
          className="inline-flex items-center justify-center h-10 border border-transparent text-xs font-medium rounded text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          title="Copy domain to clipboard"
        >
          📋
        </button>

        {/* Google Search */}
        <button
          onClick={() => window.open(`https://www.google.com/search?q=site%3A${encodeURIComponent(sitesprenBase)}`, '_blank')}
          className="inline-flex items-center justify-center h-10 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          title="Google site: search"
        >
          G
        </button>

        {/* View Backlinks */}
        {siteId && onToggleExpandedRow && (
          <button
            onClick={() => onToggleExpandedRow(siteId)}
            className="inline-flex items-center justify-center h-10 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            title="View backlinks"
          >
            👁
          </button>
        )}

        {/* Edit Row */}
        {siteId && onEditSite && (
          <button
            onClick={() => onEditSite({ sitespren_base: sitesprenBase, id: siteId })}
            className="inline-flex items-center justify-center h-10 border border-transparent text-xs font-medium rounded text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
            title="Edit row"
          >
            ✏️
          </button>
        )}

        {/* Scrape Links */}
        {siteId && onScrapeLinks && (
          <button
            onClick={() => onScrapeLinks(siteId, sitesprenBase)}
            disabled={isScrapingLinks}
            className="inline-flex items-center justify-center h-10 border border-transparent text-xs font-medium rounded text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            title="Scrape outbound links from homepage"
          >
            {isScrapingLinks ? (
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              'L'
            )}
          </button>
        )}

        {/* NW Jar */}
        <Link
          href={`/nwjar1?coltemp=option1&sitebase=${encodeURIComponent(sitesprenBase)}`}
          className="inline-flex items-center justify-center h-10 border border-transparent text-xs font-medium rounded text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          title="Open NW Jar"
        >
          NW
        </Link>

        {/* GC Jar */}
        <Link
          href={`/gconjar1?coltemp=option1&sitebase=${encodeURIComponent(sitesprenBase)}`}
          className="inline-flex items-center justify-center h-10 border border-transparent text-xs font-medium rounded text-white bg-teal-500 hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
          title="Open GC Jar"
        >
          GC
        </Link>

        {/* Driggsman */}
        <Link
          href={`/drom?sitesentered=${encodeURIComponent(sitesprenBase)}&activefilterchamber=daylight&showmainchamberboxes=no&showtundrachamber=yes`}
          className="inline-flex items-center justify-center h-10 border border-transparent text-xs font-medium rounded text-white bg-purple-500 hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
          title="Open Driggsman"
        >
          DG
        </Link>

        {/* View Only This Site */}
        <Link
          href={`/sitejar4?sitesentered=${encodeURIComponent(sitesprenBase)}`}
          className="inline-flex items-center justify-center h-10 border border-transparent text-xs font-medium rounded text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          title="View only this site"
        >
          Site
        </Link>
      </div>
    </div>
  );
}