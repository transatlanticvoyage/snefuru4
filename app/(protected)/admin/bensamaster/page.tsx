import { Metadata } from 'next';
import BensaMasterClient from './pclient';

export const metadata: Metadata = {
  title: 'Bensa Masterlist - Snefuru Admin',
};

export default function BensaMasterPage() {
  return <BensaMasterClient />;
}