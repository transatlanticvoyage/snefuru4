import { Metadata } from 'next';
import RapidlyxManagerClient from './pclient';

export const metadata: Metadata = {
  title: 'Rapidlyx Manager - Snefuru Admin',
};

export default function RapidlyxManagerPage() {
  return <RapidlyxManagerClient />;
}