import { Metadata } from 'next';
import Fanex1Client from './pclient';

export const metadata: Metadata = {
  title: 'fanex1',
};

export default function Fanex1Page() {
  return <Fanex1Client />;
}