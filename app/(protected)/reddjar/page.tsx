'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';
import ReddjarTable from './components/ReddjarTable';

export default function ReddjarPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [columnPaginationControls, setColumnPaginationControls] = useState<{
    ColumnPaginationBar1: () => JSX.Element | null;
    ColumnPaginationBar2: () => JSX.Element | null;
  } | null>(null);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [isScrapingLinks, setIsScrapingLinks] = useState(false);

  const handleScrapeLinks = async () => {
    if (selectedRows.size === 0) {
      alert('Please select at least one Reddit URL to scrape');
      return;
    }

    setIsScrapingLinks(true);
    try {
      console.log('Scraping links for selected rows:', Array.from(selectedRows));
      
      const response = await fetch('/api/reddit-scraper', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          selectedUrlIds: Array.from(selectedRows)
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      // Show results summary
      const successful = result.results.filter((r: any) => r.success).length;
      const totalLinks = result.results.reduce((sum: number, r: any) => sum + r.links_found, 0);
      
      alert(`Scraping completed!\n\nSuccessful: ${successful}/${result.results.length} URLs\nTotal links found: ${totalLinks}`);
      
      // Optionally refresh the table data to show updated counts
      window.location.reload();
      
    } catch (error) {
      console.error('Error scraping links:', error);
      alert('Error occurred while scraping links: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsScrapingLinks(false);
    }
  };

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
  }, [user, router]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <h1 className="text-2xl font-bold text-gray-800">Reddit URLs Jar</h1>
            
            {/* Column Pagination Button Bars */}
            {columnPaginationControls && (
              <>
                <div className="flex items-center">
                  {columnPaginationControls.ColumnPaginationBar1()}
                </div>
                <div className="flex items-center">
                  {columnPaginationControls.ColumnPaginationBar2()}
                </div>
              </>
            )}
            
            {/* Scrape Links Button */}
            <div className="flex items-center">
              <button
                onClick={handleScrapeLinks}
                disabled={isScrapingLinks || selectedRows.size === 0}
                className={`px-4 py-2 text-sm font-medium rounded-md border transition-colors ${
                  isScrapingLinks || selectedRows.size === 0
                    ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                    : 'bg-blue-500 text-white border-blue-500 hover:bg-blue-600 hover:border-blue-600'
                }`}
              >
                {isScrapingLinks ? 'Scraping...' : 'scrape links'}
              </button>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Table: redditurlsvat</div>
            <div className="text-xs text-gray-400">Reddit SEO Tracking</div>
          </div>
        </div>
      </div>

      {/* Main Content - Full Width ReddjarTable */}
      <div className="flex-1 overflow-hidden">
        <ReddjarTable 
          onColumnPaginationRender={setColumnPaginationControls}
          selectedRows={selectedRows}
          onSelectionChange={setSelectedRows}
        />
      </div>
    </div>
  );
}