import { Metadata } from 'next';
import DriggsmanClient from './pclient';

export const metadata: Metadata = {
  title: '/driggsman',
};

export default function DriggsmanPage() {
  return <DriggsmanClient />;
}