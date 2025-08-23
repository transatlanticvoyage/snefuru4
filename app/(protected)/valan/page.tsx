import { Metadata } from 'next';
import ValanClient from './pclient';

export const metadata: Metadata = {
  title: 'valan',
};

export default function ValanPage() {
  return <ValanClient />;
}