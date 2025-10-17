'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface Industry {
  industry_id: number;
  industry_name: string;
  industry_description: string | null;
}

interface IndustrySelectorPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (industry: { industry_id: number; industry_name: string }) => void;
  currentSelection: { industry_id: number; industry_name: string } | null;
}

export default function IndustrySelectorPopup({
  isOpen,
  onClose,
  onSelect,
  currentSelection
}: IndustrySelectorPopupProps) {
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const supabase = createClientComponentClient();

  useEffect(() => {
    if (isOpen) {
      fetchIndustries();
    }
  }, [isOpen]);

  const fetchIndustries = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('industries')
        .select('*')
        .order('industry_name');

      if (error) throw error;
      setIndustries(data || []);
    } catch (error) {
      console.error('Error fetching industries:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredIndustries = industries.filter(industry =>
    industry.industry_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    industry.industry_description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-[800px] max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800">Select Industry</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Search */}
        <div className="px-6 py-3 border-b">
          <input
            type="text"
            placeholder="Search industries..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            autoFocus
          />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto px-6 py-4">
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading industries...</div>
          ) : (
            <table className="w-full border-collapse border border-gray-300">
              <thead className="bg-gray-100 sticky top-0">
                <tr>
                  <th className="border border-gray-300 px-3 py-2 text-left text-xs font-bold">ID</th>
                  <th className="border border-gray-300 px-3 py-2 text-left text-xs font-bold">Industry Name</th>
                  <th className="border border-gray-300 px-3 py-2 text-left text-xs font-bold">Description</th>
                  <th className="border border-gray-300 px-3 py-2 text-center text-xs font-bold">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredIndustries.map((industry) => (
                  <tr
                    key={industry.industry_id}
                    className={`hover:bg-blue-50 ${
                      currentSelection?.industry_id === industry.industry_id ? 'bg-blue-100' : ''
                    }`}
                  >
                    <td className="border border-gray-300 px-3 py-2 text-xs">
                      {industry.industry_id}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-xs font-medium">
                      {industry.industry_name}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-xs text-gray-600">
                      {industry.industry_description || '—'}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-center">
                      <button
                        onClick={() => {
                          onSelect({
                            industry_id: industry.industry_id,
                            industry_name: industry.industry_name
                          });
                          onClose();
                        }}
                        className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                          currentSelection?.industry_id === industry.industry_id
                            ? 'bg-green-600 text-white hover:bg-green-700'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        {currentSelection?.industry_id === industry.industry_id ? 'Selected' : 'Select'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          
          {!loading && filteredIndustries.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No industries found matching "{searchTerm}"
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t px-6 py-3 flex justify-between items-center bg-gray-50">
          <div className="text-sm text-gray-600">
            {filteredIndustries.length} {filteredIndustries.length === 1 ? 'industry' : 'industries'}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-400"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

