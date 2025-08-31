import { Metadata } from 'next';
import ColtempjarClient from './pclient';

export const metadata: Metadata = {
  title: 'Coltempjar - Column Templates',
};

export default function ColtempjarPage() {
  return <ColtempjarClient />;
}