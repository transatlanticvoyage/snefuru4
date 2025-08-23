import { Metadata } from 'next';
import TornadoClient from './pclient';

export const metadata: Metadata = {
  title: 'tornado',
};

export default function TornadoPage() {
  return <TornadoClient />;
}