import F23StorageCleanupForm from './components/F23StorageCleanupForm';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'F23 Storage Cleanup',
};

export default function F23StorageCleanupPage() {
  return (
    <main className="min-h-screen">
      <F23StorageCleanupForm />
    </main>
  );
}