import { Metadata } from 'next';
import StatusBox1Client from './pclient';

export const metadata: Metadata = {
  title: 'statusbox1 - Snefuru',
};

export default function StatusBox1Page() {
  return <StatusBox1Client />;
} 