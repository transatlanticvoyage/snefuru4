import { Metadata } from 'next';
import AspejarClient from './pclient';

export const metadata: Metadata = {
  title: '/aspejar',
};

export default function AspejarPage() {
  return <AspejarClient />;
}