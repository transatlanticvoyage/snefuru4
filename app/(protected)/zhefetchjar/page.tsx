import { Metadata } from 'next';
import ZhefetchjarClient from './pclient';

export const metadata: Metadata = {
  title: '/zhefetchjar',
};

export default function ZhefetchjarPage() {
  return <ZhefetchjarClient />;
}