import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Firestorm Data Badge Example',
};

export default function ExampleFirestormBadgePage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Firestorm Data Badge Example</h1>
    </div>
  );
}