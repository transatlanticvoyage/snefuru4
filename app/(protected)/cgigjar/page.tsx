import { Metadata } from 'next';
import CgigjarClient from './pclient';

export const metadata: Metadata = {
  title: '/cgigjar',
};

export default function CgigjarPage() {
  return <CgigjarClient />;
}