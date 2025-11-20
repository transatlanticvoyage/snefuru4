import { Metadata } from 'next';
import CitationCraneClient from './pclient';

export const metadata: Metadata = {
  title: 'Citation Crane',
};

export default function CitationCranePage() {
  return <CitationCraneClient />;
}