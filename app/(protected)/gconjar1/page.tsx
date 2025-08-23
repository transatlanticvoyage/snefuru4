import { Metadata } from 'next';
import Gconjar1Client from './pclient';

export const metadata: Metadata = {
  title: 'gconjar1',
};

export default function Gconjar1Page() {
  return <Gconjar1Client />;
}