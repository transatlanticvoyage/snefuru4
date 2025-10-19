import { Metadata } from 'next';
import LeadsmartPicoClient from './pclient';
import '@/app/styles/shenfur_th_cells_db_table_row.css';

export const metadata: Metadata = {
  title: 'Leadsmart Pico Cache Monitoring',
};

export default function LeadsmartPicoPage() {
  return <LeadsmartPicoClient />;
}