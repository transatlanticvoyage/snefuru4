import { Metadata } from 'next';
import PlanchjarClient from './pclient';

export const metadata: Metadata = {
  title: '/planchjar - Tregnar',
};

export default function PlanchjarPage() {
  return <PlanchjarClient />;
}