import { Metadata } from 'next';
import XPagesManager1Client from './pclient';

export const metadata: Metadata = {
  title: 'X Pages Manager - Snefuru',
};

export default function XPagesManager1Page() {
  return <XPagesManager1Client />;
}