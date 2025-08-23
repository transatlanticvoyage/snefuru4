import { Metadata } from 'next';
import ObiClient from './pclient';

export const metadata: Metadata = {
  title: 'Obi Page Settings Manager - Snefuru',
};

export default function ObiPage() {
  return <ObiClient />;
}