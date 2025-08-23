import { Metadata } from 'next';
import Domjar1Client from './pclient';

export const metadata: Metadata = {
  title: 'domjar1 - Snefuru',
};

export default function Domjar1Page() {
  return <Domjar1Client />;
}