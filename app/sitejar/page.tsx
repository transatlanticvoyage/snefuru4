import { Metadata } from 'next';
import SitejarClient from './pclient';

export const metadata: Metadata = {
  title: 'Sitejar',
  description: 'Sitejar page',
};

export default function SitejarPage() {
  return <SitejarClient />;
}