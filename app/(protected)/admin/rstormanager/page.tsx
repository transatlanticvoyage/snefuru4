import { Metadata } from 'next';
import RstorManagerClient from './pclient';

export const metadata: Metadata = {
  title: 'RSTOR Manager',
};

export default function RstorManagerPage() {
  return <RstorManagerClient />;
}