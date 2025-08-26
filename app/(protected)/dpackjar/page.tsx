import { Metadata } from 'next';
import DpackjarClient from './pclient';

export const metadata: Metadata = {
  title: '/dpackjar',
};

export default function DpackjarPage() {
  return <DpackjarClient />;
}