import { Metadata } from 'next';
import SunjarClient from './pclient';

export const metadata: Metadata = {
  title: 'Sunjar - Sun Row System Management',
};

export default function SunjarPage() {
  return <SunjarClient />;
}