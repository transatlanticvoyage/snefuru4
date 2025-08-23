import { Metadata } from 'next';
import BaklidClient from './pclient';

export const metadata: Metadata = {
  title: 'Bakli Mockup - Snefuru',
};

export default function BaklidPage() {
  return <BaklidClient />;
}