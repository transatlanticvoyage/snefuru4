import { Metadata } from 'next';
import TrenchClusterJarClient from './pclient';
import '@/app/styles/shenfur_th_cells_db_table_row.css';

export const metadata: Metadata = {
  title: 'Trench Cluster Jar',
};

export default function TrenchClusterJarPage() {
  return <TrenchClusterJarClient />;
}