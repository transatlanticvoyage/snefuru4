import { Metadata } from 'next';
import Skojar1Client from './pclient';

export const metadata: Metadata = {
  title: '/skojar1',
};

export default function Skojar1Page() {
  return <Skojar1Client />;
}