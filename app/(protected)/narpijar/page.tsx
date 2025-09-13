import { Metadata } from 'next';
import NarpijarClient from './pclient';

export const metadata: Metadata = {
  title: 'Narpi Pushes Jar - Snefuru',
};

export default function NarpijarPage() {
  return <NarpijarClient />;
}