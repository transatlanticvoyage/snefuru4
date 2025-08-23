import { Metadata } from 'next';
import MoonjarClient from './pclient';

export const metadata: Metadata = {
  title: 'Moonjar - Moon Row Modules Management System',
};

export default function MoonjarPage() {
  return <MoonjarClient />;
}