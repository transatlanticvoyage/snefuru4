import { Metadata } from 'next';
import DomnividClient from './pclient';

type Props = {
  searchParams: { [key: string]: string | string[] | undefined }
}

export async function generateMetadata(
  { searchParams }: Props
): Promise<Metadata> {
  const domainBase = searchParams.domain_base;
  const domainDisplay = typeof domainBase === 'string' ? ` - ${domainBase}` : '';
  
  return {
    title: `domnivid${domainDisplay} - Snefuru`,
  }
}

export default function DomnividPage() {
  return <DomnividClient />;
}