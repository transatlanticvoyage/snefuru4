import { Metadata } from 'next';
import SerpjarClient from './pclient';

export const metadata: Metadata = {
  title: '/serpjar',
};

export default function SerpjarPage() {
  return <SerpjarClient />;
}