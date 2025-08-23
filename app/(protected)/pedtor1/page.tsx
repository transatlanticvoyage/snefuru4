import { Metadata } from 'next';
import Pedtor1Client from './pclient';

export const metadata: Metadata = {
  title: '/pedtor1 - Snefuru',
};

export default function Pedtor1Page() {
  return <Pedtor1Client />;
}