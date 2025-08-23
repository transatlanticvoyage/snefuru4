import { Metadata } from 'next';
import BaklijarClient from './pclient';

export const metadata: Metadata = {
  title: 'Bakli Mockups - Admin - Snefuru',
};

export default function BaklijarPage() {
  return <BaklijarClient />;
}