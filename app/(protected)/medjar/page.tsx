import { Metadata } from 'next';
import MedjarClient from './pclient';

export const metadata: Metadata = {
  title: '/medjar',
};

export default function MedjarPage() {
  return <MedjarClient />;
}