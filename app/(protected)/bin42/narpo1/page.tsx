import { Metadata } from 'next';
import Narpo1Client from './pclient';

export const metadata: Metadata = {
  title: 'narpo1 - Snefuru',
};

export default function Narpo1Page() {
  return <Narpo1Client />;
}