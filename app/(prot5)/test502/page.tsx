import { Metadata } from 'next';
import Test502Client from './Test502Client';

export const metadata: Metadata = {
  title: '/test502',
  description: 'Test page #2 for server-side metadata in prot5 route group',
};

export default function Test502Page() {
  return <Test502Client />;
}