import { Metadata } from 'next';
import HcomjarClient from './pclient';

export const metadata: Metadata = {
  title: 'hcomjar',
};

export default function HcomjarPage() {
  return <HcomjarClient />;
}