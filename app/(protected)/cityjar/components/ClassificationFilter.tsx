'use client';

import { useState } from 'react';

interface ClassificationFilterProps {
  value: string;
  onChange: (value: string) => void;
}

export default function ClassificationFilter({ value, onChange }: ClassificationFilterProps) {
  const options = [
    { value: 'all', label: 'all' },
    { value: 'principal_city', label: 'principal_city' },
    { value: 'formidable_suburb', label: 'formidable_suburb' },
    { value: 'smaller_suburb', label: 'smaller_suburb' }
  ];

  return (
    <div className="flex flex-col">
      <label className="font-bold text-xs mb-1">classification</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`px-3 py-1.5 rounded border text-sm ${
          value === 'all' 
            ? 'bg-white border-gray-300 text-gray-700' 
            : 'bg-navy-900 border-navy-900 text-white'
        }`}
        style={{
          backgroundColor: value !== 'all' ? '#1e3a8a' : undefined,
          color: value !== 'all' ? 'white' : undefined
        }}
      >
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}