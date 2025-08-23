import { Metadata } from 'next';
import Skojar2Client from './pclient';

export const metadata: Metadata = {
  title: '/skojar2',
};

export default function Skojar2Page() {
  return <Skojar2Client />;
}