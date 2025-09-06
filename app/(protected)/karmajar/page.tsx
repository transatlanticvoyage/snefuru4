import { Metadata } from 'next';
import KarmajarClient from './pclient';

export const metadata: Metadata = {
  title: 'Karmajar - Karma Wizard Sessions',
};

export default function KarmajarPage() {
  return <KarmajarClient />;
}