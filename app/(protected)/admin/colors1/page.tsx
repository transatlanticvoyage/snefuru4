import { Metadata } from 'next';
import Colors1Client from './pclient';

export const metadata: Metadata = {
  title: '/colors1 - Snefuru',
};

export default function Colors1Page() {
  return <Colors1Client />;
}