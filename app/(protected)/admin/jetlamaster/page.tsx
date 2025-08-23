import { Metadata } from 'next';
import JetlaMasterClient from './pclient';

export const metadata: Metadata = {
  title: 'Jetla Masterlist - Snefuru Admin',
};

export default function JetlaMasterPage() {
  return <JetlaMasterClient />;
}