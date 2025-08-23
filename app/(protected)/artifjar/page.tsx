import { Metadata } from 'next';
import ArtifjarClient from './pclient';

export const metadata: Metadata = {
  title: 'artifjar',
};

export default function ArtifjarPage() {
  return <ArtifjarClient />;
}