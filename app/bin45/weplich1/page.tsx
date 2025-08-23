import { Metadata } from 'next';
import Weplich1Client from './pclient';

export const metadata: Metadata = {
  title: 'WordPress Sites - Snefuru',
};

export default function Weplich1Page() {
  return <Weplich1Client />;
} 