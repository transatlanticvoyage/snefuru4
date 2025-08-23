import { Metadata } from 'next';
import CallPlatjarClient from './pclient';

export const metadata: Metadata = {
  title: '/callplatjar',
};

export default function CallPlatjarPage() {
  return <CallPlatjarClient />;
}