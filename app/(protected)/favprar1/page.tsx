import { Metadata } from 'next';
import FavPrar1Client from './pclient';

export const metadata: Metadata = {
  title: 'favprar1 - Snefuru',
};

export default function FavPrar1Page() {
  return <FavPrar1Client />;
}