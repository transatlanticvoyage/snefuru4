import { Metadata } from 'next';
import Stuff1Client from './pclient';

export const metadata: Metadata = {
  title: 'stuff1 - Snefuru',
};

export default function Stuff1Page() {
  return <Stuff1Client />;
} 