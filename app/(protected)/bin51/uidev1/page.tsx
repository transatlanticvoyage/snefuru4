import Uidev1 from './components/uidev1';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Uidev1 - Snefuru',
};

export default function Uidev1Page() {
  return (
    <main className="min-h-screen">
      <Uidev1 />
    </main>
  );
} 