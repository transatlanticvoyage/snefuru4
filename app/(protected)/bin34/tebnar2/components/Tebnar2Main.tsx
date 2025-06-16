'use client';

import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function Tebnar2Main() {
  const { user } = useAuth();
  const router = useRouter();

  // Check if user is authenticated
  if (!user) {
    router.push('/login');
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Tebnar2 - Image Plans Management</h1>
        <p className="text-gray-600">
          Independent clone of tebnar1 for images_plans table management
        </p>
        <div className="mt-4 p-4 bg-green-100 border border-green-300 rounded-lg">
          <h2 className="text-lg font-semibold text-green-800 mb-2">✅ Phase 1 Complete: Foundation Setup</h2>
          <ul className="text-sm text-green-700 space-y-1">
            <li>• Directory structure created at /bin34/tebnar2/</li>
            <li>• TypeScript interfaces defined in tebnar2-types.ts</li>
            <li>• Constants extracted to tebnar2-constants.ts with TBN2_ prefixes</li>
            <li>• Basic routing verification successful</li>
          </ul>
          <p className="mt-3 text-sm text-green-600 font-medium">
            Ready to proceed to Phase 2: Core Component Architecture
          </p>
        </div>
      </div>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">Next Steps</h3>
        <div className="space-y-2 text-sm text-blue-800">
          <p><strong>Phase 2:</strong> Break down tebnar1 component into manageable chunks</p>
          <p><strong>Components to create:</strong></p>
          <ul className="ml-4 space-y-1">
            <li>• Tebnar2Table.tsx - Core table rendering</li>
            <li>• Tebnar2Columns.tsx - Column configuration</li>
            <li>• Tebnar2Filters.tsx - Filtering and search</li>
            <li>• Tebnar2ImagePreview.tsx - Image handling</li>
            <li>• Tebnar2Actions.tsx - Row actions</li>
          </ul>
        </div>
      </div>
    </div>
  );
}