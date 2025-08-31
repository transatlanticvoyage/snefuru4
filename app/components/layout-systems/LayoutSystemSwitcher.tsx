'use client';

import { useLayoutSystem } from './LayoutSystemProvider';

export default function LayoutSystemSwitcher() {
  const { currentSystem, availableSystems, switchSystem } = useLayoutSystem();

  // Don't show switcher if user only has access to one system
  if (availableSystems.length <= 1) {
    return null;
  }

  return (
    <div className="layout-system-switcher p-3 border-t border-gray-600">
      <label className="block text-xs font-medium text-gray-300 mb-2">
        Layout System:
      </label>
      <select 
        value={currentSystem}
        onChange={(e) => switchSystem(e.target.value)}
        className="w-full px-2 py-1 text-xs bg-gray-700 text-white border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {availableSystems.map(system => (
          <option key={system.id} value={system.id}>
            {system.name}
          </option>
        ))}
      </select>
      <p className="text-xs text-gray-400 mt-1">
        {availableSystems.find(s => s.id === currentSystem)?.description}
      </p>
    </div>
  );
}