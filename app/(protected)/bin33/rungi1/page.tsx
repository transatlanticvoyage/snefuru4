import { Metadata } from 'next';
import Rungi1Client from './pclient';

export const metadata: Metadata = {
  title: 'rungi1 - Snefuru',
};

export default function Rungi1Page() {
  return <Rungi1Client />;
} 