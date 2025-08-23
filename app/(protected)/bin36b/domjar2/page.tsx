import { Metadata } from 'next';
import Domjar2Client from './pclient';

export const metadata: Metadata = {
  title: 'domjar2 - Snefuru',
};

export default function Domjar2Page() {
  return <Domjar2Client />;
} 