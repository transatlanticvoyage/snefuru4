import Tebnar2Main from './components/Tebnar2Main';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'tebnar2',
};

export default function Tebnar2Page() {
  return (
    <main className="min-h-screen">
      <Tebnar2Main />
    </main>
  );
}