import { Metadata } from 'next';
import KwtagzarClient from './pclient';

export const metadata: Metadata = {
  title: 'kwtagzar',
};

export default function KwtagzarPage() {
  return <KwtagzarClient />;
}