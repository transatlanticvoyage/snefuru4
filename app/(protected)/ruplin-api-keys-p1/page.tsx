import { Metadata } from 'next';
import RuplinApiKeysClient from './pclient';

export const metadata: Metadata = {
  title: 'API Keys - Ruplin WP Plugin - Snefuru',
};

export default function RuplinApiKeysPage() {
  return <RuplinApiKeysClient />;
}