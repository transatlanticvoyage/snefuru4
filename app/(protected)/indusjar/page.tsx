import { Metadata } from 'next';
import IndusjarClient from './pclient';

export const metadata: Metadata = {
  title: 'indusjar',
};

export default function IndusjarPage() {
  return <IndusjarClient />;
}