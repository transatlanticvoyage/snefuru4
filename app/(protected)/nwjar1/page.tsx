import { Metadata } from 'next';
import NwJar1Client from './pclient';

export const metadata: Metadata = {
  title: '/nwjar1 - Snefuru',
};

export default function NwJar1Page() {
  return <NwJar1Client />;
}