'use client';

import { useState } from 'react';

interface InputsExpandEditorProps {
  isOpen: boolean;
  fieldName: 'inputs_v1' | 'inputs_v2' | 'inputs_v3';
  initialValue: string;
  onSave: (value: string) => Promise<void>;
  onClose: () => void;
}

export default function InputsExpandEditor({
  isOpen,
  fieldName,
  initialValue,
  onSave,
  onClose
}: InputsExpandEditorProps) {
  const [value, setValue] = useState(initialValue);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(value);
      onClose();
    } catch (error) {
      console.error('Error saving:', error);
      alert('Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setValue(initialValue); // Reset to initial value
    onClose();
  };

  if (!isOpen) return null;

  const displayName = fieldName.replace('_', ' ').toUpperCase();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div 
        className="bg-white rounded-lg shadow-lg overflow-hidden flex flex-col"
        style={{ width: '800px', height: '100vh' }}
      >
        {/* Header with Save button */}
        <div className="px-6 py-4 border-b bg-gray-50 flex items-center justify-between">
          <h2 className="text-xl font-bold">
            {displayName}
          </h2>
          <div className="flex space-x-3">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 bg-blue-900 text-white rounded hover:bg-blue-800 transition-colors font-medium disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={handleClose}
              disabled={isSaving}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
        
        {/* Content area */}
        <div className="flex-1 p-6">
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full h-full resize-none border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder={`Enter ${displayName.toLowerCase()} content...`}
            style={{ minHeight: 'calc(100vh - 140px)' }}
            disabled={isSaving}
          />
        </div>
      </div>
    </div>
  );
}