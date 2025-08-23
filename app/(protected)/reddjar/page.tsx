import { Metadata } from 'next';
import ReddjarClient from './pclient';

export const metadata: Metadata = {
  title: 'reddjar',
};

export default function ReddjarPage() {
  return <ReddjarClient />;
}