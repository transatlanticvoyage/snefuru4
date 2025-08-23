import { Metadata } from 'next';
import HomeClient from './pclient';

export const metadata: Metadata = {
  title: 'home',
};

export default function HomePage() {
  return <HomeClient />;
}