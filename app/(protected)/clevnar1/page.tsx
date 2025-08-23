import { Metadata } from 'next';
import Clevnar1Client from './pclient';

export const metadata: Metadata = {
  title: 'clevnar1',
};

export default function Clevnar1Page() {
  return <Clevnar1Client />;
}