import { Metadata } from 'next';
import ScafjarClient from './pclient';

export const metadata: Metadata = {
  title: '/scafjar',
};

export default function ScafjarPage() {
  return <ScafjarClient />;
}