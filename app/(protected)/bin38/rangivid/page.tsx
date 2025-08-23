import { Metadata } from 'next';
import RangividClient from './pclient';

export const metadata: Metadata = {
  title: 'rangivid - Snefuru',
};

export default function RangividPage() {
  return <RangividClient />;
}