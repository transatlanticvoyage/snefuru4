import { Metadata } from 'next';
import Sitejar3Client from './pclient';

export const metadata: Metadata = {
  title: 'sitejar3 - Snefuru',
};

export default function Sitejar3Page() {
  return <Sitejar3Client />;
}