import { Metadata } from 'next';
import WepfolClient from './pclient';

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function generateMetadata(
  { searchParams }: Props
): Promise<Metadata> {
  const params = await searchParams;
  const site = params.site;
  const siteDisplay = typeof site === 'string' ? site : 'Unknown Site';
  
  return {
    title: `WP Content - ${siteDisplay} - Snefuru`,
  }
}

export default function WepfolPage() {
  return <WepfolClient />;
} 