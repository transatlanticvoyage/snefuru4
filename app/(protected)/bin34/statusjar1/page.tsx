import { Metadata } from 'next';
import StatusJar1Client from './pclient';

export const metadata: Metadata = {
  title: 'statusjar1 - Snefuru',
};

export default function StatusJar1Page() {
  return <StatusJar1Client />;
} 