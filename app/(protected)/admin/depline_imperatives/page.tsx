import { Metadata } from 'next';
import DeplineImperativesClient from './pclient';

export const metadata: Metadata = {
  title: 'Depline Imperatives - Admin - Snefuru',
};

export default function DeplineImperativesPage() {
  return <DeplineImperativesClient />;
}