import { Metadata } from 'next';
import AmazonjarClient from './pclient';

export const metadata: Metadata = {
  title: '/amazonjar',
};

export default function AmazonjarPage() {
  return <AmazonjarClient />;
}