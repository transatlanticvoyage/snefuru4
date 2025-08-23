import { Metadata } from 'next';
import Panjar1Client from './pclient';

export const metadata: Metadata = {
  title: 'panjar1 - Snefuru',
};

export default function Panjar1Page() {
  return <Panjar1Client />;
}