'use client';

import { useState, useEffect } from 'react';

export default function SetupClient() {
  const [status, setStatus] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(1);

  const handleSetup = async () => {
    try {
      setStatus('Setting up database...');
      setError(null);

      const response = await fetch('/api/setup-database', {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to set up database');
      }

      setStatus('Database setup complete!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setStatus('');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Database Setup
          </h2>
        </div>
        <div className="mt-8 space-y-6">
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}
          {status && (
            <div className="rounded-md bg-green-50 p-4">
              <div className="text-sm text-green-700">{status}</div>
            </div>
          )}
          <button
            onClick={handleSetup}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Set Up Database
          </button>
        </div>
      </div>
    </div>
  );
}