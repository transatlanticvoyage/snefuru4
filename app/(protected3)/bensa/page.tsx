import { Metadata } from 'next';
import BensaClient from './pclient';

export const metadata: Metadata = {
  title: 'Bensa Field Management System - Snefuru',
};

export default function BensaPage() {
  return <BensaClient />;
}