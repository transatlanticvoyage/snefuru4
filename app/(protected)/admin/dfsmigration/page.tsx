import { Metadata } from 'next';
import DFSMigrationClient from './pclient';

export const metadata: Metadata = {
  title: 'DFS Migration - Admin',
};

export default function DFSMigrationPage() {
  return <DFSMigrationClient />;
}