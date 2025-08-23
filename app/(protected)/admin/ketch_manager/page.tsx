import { Metadata } from 'next';
import KetchManagerClient from './pclient';

export const metadata: Metadata = {
  title: 'Ketch Manager - Snefuru',
};

export default function KetchManagerPage() {
  return <KetchManagerClient />;
}