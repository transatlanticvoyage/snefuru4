'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';
import ZhedoriButtonBar from '@/app/components/ZhedoriButtonBar';
import KeywordsHubTable from './components/KeywordsHubTable';
import TagsPlenchPopup from './components/TagsPlenchPopup';

export default function KwjarPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  // Tags plench popup state
  const [isTagsPopupOpen, setIsTagsPopupOpen] = useState(false);
  const [selectedTag, setSelectedTag] = useState<{ tag_id: number; tag_name: string } | null>(null);

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

  // Set page title
  useEffect(() => {
    document.title = '/kwjar - Snefuru';
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <h1 className="text-2xl font-bold text-gray-800">🔍 Keywords Hub</h1>
            <ZhedoriButtonBar />
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsTagsPopupOpen(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                tags plench button
              </button>
              {selectedTag && (
                <div className="text-sm text-gray-600 font-medium">
                  {selectedTag.tag_name}
                </div>
              )}
              <button
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                delete kws and clear from any cncglub.kwslot*
              </button>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">DataForSEO Integration</div>
            <div className="text-xs text-gray-400">Project: Keywords Research</div>
          </div>
        </div>
      </div>

      {/* Main Content - Full Width KeywordsHubTable */}
      <div className="flex-1 overflow-hidden">
        <KeywordsHubTable selectedTagId={selectedTag?.tag_id} />
      </div>

      {/* Tags Plench Popup */}
      {isTagsPopupOpen && (
        <TagsPlenchPopup
          isOpen={isTagsPopupOpen}
          onClose={() => setIsTagsPopupOpen(false)}
          onSelectTag={(tag) => {
            setSelectedTag(tag);
            setIsTagsPopupOpen(false);
          }}
          selectedTag={selectedTag}
        />
      )}
    </div>
  );
}