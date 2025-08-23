import { Metadata } from 'next';
import Flatx1Client from './pclient';

export const metadata: Metadata = {
  title: '/flatx1 - Snefuru',
};

export default function Flatx1Page() {
  return <Flatx1Client />;
}