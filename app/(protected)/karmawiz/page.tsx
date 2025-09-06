import { Metadata } from 'next';
import KarmawizClient from './pclient';

export const metadata: Metadata = {
  title: 'Karmawiz - Karma Wizard',
};

export default function KarmawizPage() {
  return <KarmawizClient />;
}