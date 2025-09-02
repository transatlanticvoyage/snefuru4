import { Metadata } from 'next';
import DriggsmanClient from './pclient';

export const metadata: Metadata = {
  title: '/drom',
};

export default function DriggsmanPage() {
  return <DriggsmanClient />;
}