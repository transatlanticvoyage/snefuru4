import { Metadata } from 'next';
import Czonejar1Client from './pclient';

export const metadata: Metadata = {
  title: 'czonejar1',
};

export default function Czonejar1Page() {
  return <Czonejar1Client />;
}