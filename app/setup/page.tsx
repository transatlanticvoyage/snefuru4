import { Metadata } from 'next';
import SetupClient from './pclient';

export const metadata: Metadata = {
  title: 'setup - Snefuru',
};

export default function SetupPage() {
  return <SetupClient />;
} 