import { Metadata } from 'next';
import Cnjar2Client from './pclient';

export const metadata: Metadata = {
  title: '/cnjar2',
};

export default function Cnjar2Page() {
  return <Cnjar2Client />;
}