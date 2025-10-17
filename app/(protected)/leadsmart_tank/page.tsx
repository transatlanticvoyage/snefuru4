import { Metadata } from 'next';
import LeadsmartTankClient from './pclient';

export const metadata: Metadata = {
  title: 'Leadsmart Tank',
};

export default function LeadsmartTankPage() {
  return <LeadsmartTankClient />;
}

