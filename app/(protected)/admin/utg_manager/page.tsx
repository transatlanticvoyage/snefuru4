import { Metadata } from 'next';
import UtgManagerClient from './pclient';

export const metadata: Metadata = {
  title: 'UTG Manager - Snefuru',
};

export default function UtgManagerPage() {
  return <UtgManagerClient />;
}