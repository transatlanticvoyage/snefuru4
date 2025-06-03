"use client";
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function NarpividPage() {
  const searchParams = useSearchParams();
  const id = searchParams?.get('id');

  useEffect(() => {
    // Set document title
    document.title = 'narpivid - Snefuru';
  }, []);

  return (
    <div className="p-6 min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Narpi Push Details</h1>
              <p className="text-sm text-gray-500 mt-1">
                {id ? `Viewing details for push ID: ${id}` : 'No push ID provided'}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => window.history.back()}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <svg className="-ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back
              </button>
            </div>
          </div>
        </div>

        {/* Main Content Area - Currently Blank */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
          <div className="text-center py-12">
            <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Page Content Coming Soon</h3>
            <p className="text-gray-500">
              Individual narpi push details and functionality will be implemented here.
            </p>
            {id && (
              <p className="text-sm text-gray-400 mt-2 font-mono">
                Push ID: {id}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 