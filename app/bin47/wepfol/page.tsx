import { Metadata } from 'next';
import WepfolClient from './pclient';

type Props = {
  searchParams: { [key: string]: string | string[] | undefined }
}

export async function generateMetadata(
  { searchParams }: Props
): Promise<Metadata> {
  const site = searchParams.site;
  const siteDisplay = typeof site === 'string' ? site : 'Unknown Site';
  
  return {
    title: `WP Content - ${siteDisplay} - Snefuru`,
  }
}

export default function WepfolPage() {
  return <WepfolClient />;
} 