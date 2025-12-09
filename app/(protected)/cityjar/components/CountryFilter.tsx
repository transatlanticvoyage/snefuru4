'use client';

interface CountryFilterProps {
  value: string;
  onChange: (value: string) => void;
}

export default function CountryFilter({ value, onChange }: CountryFilterProps) {
  const options = [
    { value: 'us', label: 'us' },
    { value: 'ca', label: 'ca' },
    { value: 'uk', label: 'uk' },
    { value: 'nz', label: 'nz' },
    { value: 'za', label: 'za' },
    { value: 'au', label: 'au' }
  ];

  return (
    <div className="flex flex-col">
      <label className="font-bold text-xs mb-1">country</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`px-3 py-1.5 rounded border text-sm ${
          value === 'us' 
            ? 'bg-white border-gray-300 text-gray-700' 
            : 'bg-navy-900 border-navy-900 text-white'
        }`}
        style={{
          backgroundColor: value !== 'us' ? '#1e3a8a' : undefined,
          color: value !== 'us' ? 'white' : undefined
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