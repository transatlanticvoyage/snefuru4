import { Metadata } from 'next';
import Test501Client from './Test501Client';

export const metadata: Metadata = {
  title: '/test501',
  description: 'Test page for server-side metadata in prot5 route group',
};

export default function Test501Page() {
  return <Test501Client />;
}