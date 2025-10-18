import { Metadata } from 'next';
import LeadsmartMorphClient from './pclient';

export const metadata: Metadata = {
  title: 'Leadsmart Morph',
};

export default function LeadsmartMorphPage() {
  return <LeadsmartMorphClient />;
}

