import { Metadata } from 'next';
import PedbarClient from './pclient';

export const metadata: Metadata = {
  title: 'pedbar',
};

export default function PedbarPage() {
  return <PedbarClient />;
}