import { Metadata } from 'next';
import TshelljarClient from './pclient';

export const metadata: Metadata = {
  title: 'Table Shells - Snefuru',
};

export default function TshelljarPage() {
  return <TshelljarClient />;
}