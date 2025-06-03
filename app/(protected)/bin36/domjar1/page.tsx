import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'domjar1',
};

export default function Domjar1Page() {
  return (
    <main className="min-h-screen p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        Domjar1
      </h1>
    </main>
  );
} 