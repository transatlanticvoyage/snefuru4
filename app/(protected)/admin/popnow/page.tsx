import { Metadata } from 'next';
import PopNowClient from './pclient';

export const metadata: Metadata = {
  title: '/admin/popnow - Snefuru',
};

export default function PopNowPage() {
  return <PopNowClient />;
}