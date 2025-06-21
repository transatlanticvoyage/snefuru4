'use client';

import { FPopup1TabsProps } from './types';

export const FPopup1Tabs = ({ tabs, activeTab, onTabChange }: FPopup1TabsProps) => {
  return (
    <div className="border-b border-gray-200 bg-gray-50">
      <nav className="flex">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-blue-500 text-blue-600 bg-white'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
};