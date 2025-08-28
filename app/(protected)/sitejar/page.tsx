import { Metadata } from 'next';
import SitejarClient from './pclient';

export const metadata: Metadata = {
  title: 'Sitejar',
};

export default function SitejarPage() {
  return <SitejarClient />;
}