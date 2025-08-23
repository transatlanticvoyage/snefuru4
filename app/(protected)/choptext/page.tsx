import { Metadata } from 'next';
import ChopTextClient from './pclient';

export const metadata: Metadata = {
  title: 'choptext',
};

export default function ChopTextPage() {
  return <ChopTextClient />;
}