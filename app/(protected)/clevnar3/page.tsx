import { Metadata } from 'next';
import Clevnar3Client from './pclient';

export const metadata: Metadata = {
  title: 'clevnar3 - Snefuru',
};

export default function Clevnar3Page() {
  return <Clevnar3Client />;
}