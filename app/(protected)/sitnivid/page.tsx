import { Metadata } from 'next';
import SitnividClient from './pclient';

export const metadata: Metadata = {
  title: 'sitnivid - Snefuru',
};

export default function SitnividPage() {
  return <SitnividClient />;
}