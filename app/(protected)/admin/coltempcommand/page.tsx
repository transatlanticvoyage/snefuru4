import { Metadata } from 'next';
import ColtempCommandClient from './pclient';

export const metadata: Metadata = {
  title: 'Coltemp Command - Snefuru Admin',
};

export default function ColtempCommandPage() {
  return <ColtempCommandClient />;
}