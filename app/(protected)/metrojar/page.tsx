import { Metadata } from 'next';
import MetrojarClient from './pclient';

export const metadata: Metadata = {
  title: '/metrojar',
};

export default function MetrojarPage() {
  return <MetrojarClient />;
}