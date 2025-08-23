import { Metadata } from 'next';
import TorlidClient from './pclient';

export const metadata: Metadata = {
  title: '/torlid - Snefuru',
};

export default function TorlidPage() {
  return <TorlidClient />;
}