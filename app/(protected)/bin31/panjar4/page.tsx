import { Metadata } from 'next';
import Panjar4Client from './pclient';

export const metadata: Metadata = {
  title: 'panjar4 - Snefuru',
};

export default function Panjar4Page() {
  return <Panjar4Client />;
} 