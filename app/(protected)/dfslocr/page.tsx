import { Metadata } from 'next';
import DfslocrClient from './pclient';

export const metadata: Metadata = {
  title: '/dfslocr',
};

export default function DfslocrPage() {
  return <DfslocrClient />;
}