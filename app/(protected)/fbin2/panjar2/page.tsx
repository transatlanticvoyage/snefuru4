import { Metadata } from 'next';
import Panjar2Client from './pclient';

export const metadata: Metadata = {
  title: 'panjar2 - Snefuru',
};

export default function Panjar2Page() {
  return <Panjar2Client />;
}