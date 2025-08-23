import { Metadata } from 'next';
import CreateNewApiKeySlotsClient from './pclient';

export const metadata: Metadata = {
  title: 'API Key Slots Management - Admin - Snefuru',
};

interface PageProps {
  searchParams: Promise<{ coltemp?: string; stickycol?: string }>
}

export default function CreateNewApiKeySlotsPage({ searchParams }: PageProps) {
  return <CreateNewApiKeySlotsClient searchParams={searchParams} />;
}