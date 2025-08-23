import { Metadata } from 'next';
import HaccjarClient from './pclient';

export const metadata: Metadata = {
  title: 'haccjar',
};

export default function HaccjarPage() {
  return <HaccjarClient />;
}