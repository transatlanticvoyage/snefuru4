import { Metadata } from 'next';
import LeadsmartTankClient from './pclient';
import '@/app/styles/shenfur_th_cells_db_table_row.css';

export const metadata: Metadata = {
  title: 'Leadsmart Tank',
};

export default function LeadsmartTankPage() {
  return <LeadsmartTankClient />;
}

