import { Metadata } from 'next';
import ZarnoManagerClient from './pclient';

export const metadata: Metadata = {
  title: 'Zarno Manager - Snefuru Admin',
};

export default function ZarnoManagerPage() {
  return <ZarnoManagerClient />;
}