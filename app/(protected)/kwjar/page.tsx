import { Metadata } from 'next';
import KwjarClient from './pclient';

export const metadata: Metadata = {
  title: 'kwjar',
};

export default function KwjarPage() {
  return <KwjarClient />;
}