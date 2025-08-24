import { Metadata } from 'next';
import Panjar3Client from './pclient';

export const metadata: Metadata = {
  title: 'panjar3 - Snefuru',
};

export default function Panjar3Page() {
  return <Panjar3Client />;
} 