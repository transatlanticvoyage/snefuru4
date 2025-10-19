import { Metadata } from 'next';
import PicoDirectClient from './client';

export const metadata: Metadata = {
  title: 'Pico Direct Cache View',
};

export default function PicoDirectPage() {
  return <PicoDirectClient />;
}