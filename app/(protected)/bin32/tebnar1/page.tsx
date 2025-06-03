import Tebnar1 from './components/tebnar1';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'tebnar1',
};

export default function Tebnar1Page() {
  return (
    <main className="min-h-screen">
      <Tebnar1 />
    </main>
  );
} 