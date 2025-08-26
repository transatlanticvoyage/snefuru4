import { Metadata } from 'next';
import DpackzarClient from './pclient';

export const metadata: Metadata = {
  title: '/dpackzar',
};

export default function DpackzarPage() {
  return <DpackzarClient />;
}