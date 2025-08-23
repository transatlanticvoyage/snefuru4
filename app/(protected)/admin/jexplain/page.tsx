import { Metadata } from 'next';
import JexplainClient from './pclient';

export const metadata: Metadata = {
  title: 'Jexplain - Snefuru Admin',
};

export default function JexplainPage() {
  return <JexplainClient />;
}