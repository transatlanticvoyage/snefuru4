'use client';

import { useState } from 'react';
import { cfunc_f71_createsite } from '../utils/cfunc_f71_createsite';

interface F71CreateSiteFormProps {
  userInternalId: string;
  onSitesCreated: () => void;
}

export default function F71CreateSiteForm({ userInternalId, onSitesCreated }: F71CreateSiteFormProps) {
  const [sitesList, setSitesList] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);

  const handleSubmit = async () => {
    if (!sitesList.trim()) {
      setNotification({
        type: 'error',
        message: 'Please enter at least one site URL'
      });
      return;
    }

    setIsSubmitting(true);
    setNotification(null);

    try {
      const result = await cfunc_f71_createsite(userInternalId, sitesList);
      
      if (result.success) {
        setNotification({
          type: 'success',
          message: `Successfully created ${result.data?.sitesCreated} site(s)!`
        });
        setSitesList(''); // Clear the textarea
        onSitesCreated(); // Refresh the table
      } else {
        setNotification({
          type: 'error',
          message: result.error || 'Failed to create sites'
        });
      }
    } catch (error) {
      console.error('Error creating sites:', error);
      setNotification({
        type: 'error',
        message: 'An error occurred while creating sites'
      });
    } finally {
      setIsSubmitting(false);
      // Clear notification after 5 seconds
      setTimeout(() => setNotification(null), 5000);
    }
  };

  return (
    <div className="mb-8 bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Add New Sites</h2>
      
      {/* Notification */}
      {notification && (
        <div className={`mb-4 p-4 rounded-md ${
          notification.type === 'success' 
            ? 'bg-green-100 border border-green-400 text-green-700' 
            : 'bg-red-100 border border-red-400 text-red-700'
        }`}>
          {notification.message}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label htmlFor="sites-list" className="block text-sm font-medium text-gray-700 mb-2">
            Enter web properties (one per line)
          </label>
          <textarea
            id="sites-list"
            value={sitesList}
            onChange={(e) => setSitesList(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={6}
            placeholder={`dogs.com
cats.com
facebook.com/catsgroup
https://linkedin.com/cats
http://www.drogs.com`}
          />
          <p className="mt-1 text-sm text-gray-500">
            URLs will be automatically cleaned (https://, http://, and www. will be removed)
          </p>
        </div>

        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold rounded-md transition-colors"
        >
          {isSubmitting ? 'Creating Sites...' : 'f71_createsite'}
        </button>
      </div>
    </div>
  );
}