import { Metadata } from 'next';
import ToryaClient from './pclient';

export const metadata: Metadata = {
  title: 'torya',
};

export default function ToryaPage() {
  return <ToryaClient />;
}