import { Metadata } from 'next';
import KwjarClient from './KwjarClient';

export const metadata: Metadata = {
  title: '/kwjar',
};

export default function KwjarPage() {
  return <KwjarClient />;
}