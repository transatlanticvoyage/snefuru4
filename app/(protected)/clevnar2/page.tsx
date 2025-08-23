import { Metadata } from 'next';
import Clevnar2Client from './pclient';

export const metadata: Metadata = {
  title: 'clevnar2 - Snefuru',
};

export default function Clevnar2Page() {
  return <Clevnar2Client />;
}