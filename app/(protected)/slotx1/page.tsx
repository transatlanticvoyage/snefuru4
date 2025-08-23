import { Metadata } from 'next';
import Slotx1Client from './pclient';

export const metadata: Metadata = {
  title: '/slotx1 - Snefuru',
};

export default function Slotx1Page() {
  return <Slotx1Client />;
}