import { Metadata } from 'next';
import Siteupd1Client from './pclient';

export const metadata: Metadata = {
  title: 'siteupd1 - Snefuru',
};

export default function Siteupd1Page() {
  return <Siteupd1Client />;
}