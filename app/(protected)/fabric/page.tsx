import { Metadata } from 'next';
import FabricClient from './pclient';

export const metadata: Metadata = {
  title: '/fabric',
};

export default function FabricPage() {
  return <FabricClient />;
}