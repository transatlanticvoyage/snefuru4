'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Narpo1RedirectPage() {
  const router = useRouter();

  useEffect(() => {
    // Get the current URL parameters
    const searchParams = new URLSearchParams(window.location.search);
    const queryString = searchParams.toString();
    
    // Redirect to the new location with preserved query parameters
    const newUrl = queryString ? `/narpijar?${queryString}` : '/narpijar';
    router.replace(newUrl);
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Redirecting...</h1>
        <p className="text-gray-600">
          This page has moved to <a href="/narpijar" className="text-blue-600 hover:underline">/narpijar</a>
        </p>
        <p className="text-sm text-gray-500 mt-2">
          You will be redirected automatically.
        </p>
      </div>
    </div>
  );
}