import { Metadata } from 'next';
import GlacrClient from './pclient';

export const metadata: Metadata = {
  title: 'Glacr',
  description: 'Glacr - Domain Glacier Management',
};

export default function GlacrPage() {
  return <GlacrClient />;
}