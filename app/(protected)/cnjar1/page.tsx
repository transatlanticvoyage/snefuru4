import { Metadata } from 'next';
import Cnjar1Client from './pclient';

export const metadata: Metadata = {
  title: 'cnjar1',
};

export default function Cnjar1Page() {
  return <Cnjar1Client />;
}