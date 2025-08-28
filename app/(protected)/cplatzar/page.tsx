import { Metadata } from 'next';
import CplatzarClient from './pclient';

export const metadata: Metadata = {
  title: 'cplatzar',
};

export default function CplatzarPage() {
  return <CplatzarClient />;
}