import { Metadata } from 'next';
import Karfi1Client from './pclient';

export const metadata: Metadata = {
  title: '/karfi1 - Snefuru',
};

export default function Karfi1Page() {
  return <Karfi1Client />;
}