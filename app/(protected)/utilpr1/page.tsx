import { Metadata } from 'next';
import UtilPr1Client from './pclient';

export const metadata: Metadata = {
  title: 'utilpr1',
};

export default function UtilPr1Page() {
  return <UtilPr1Client />;
}