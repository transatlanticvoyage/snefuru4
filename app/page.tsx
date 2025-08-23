import { Metadata } from 'next';
import HomeClient from './pclient';

export const metadata: Metadata = {
  title: 'Snefuru - Home',
};

export default function HomePage() {
  return <HomeClient />;
}