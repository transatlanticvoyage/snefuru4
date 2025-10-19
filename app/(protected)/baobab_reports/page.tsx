import { Metadata } from 'next';
import BaobobReportsClient from './client';

export const metadata: Metadata = {
  title: 'Baobab Transform Reports',
};

export default function BaobobReportsPage() {
  return <BaobobReportsClient />;
}