import { Metadata } from 'next';
import RackuijarClient from './pclient';

export const metadata: Metadata = {
  title: 'Rackui Columns Manager - Snefuru',
};

export default function RackuijarPage() {
  return <RackuijarClient />;
}