import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Ranlar1UI from './components/ranlar1';
import { ImageRecord } from './types';

export default async function Ranlar1Page() {
  const supabase = createServerComponentClient({ cookies });

  const { data: images } = await supabase
    .from('timages')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-3xl font-bold mb-6">kzelement2</div>
        <h1 className="text-2xl font-semibold text-gray-900">Ranlar1</h1>
        <Ranlar1UI images={images as ImageRecord[]} />
      </div>
    </div>
  );
} 