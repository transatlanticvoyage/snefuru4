import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { notFound } from 'next/navigation';
import NwpiContentView from './components/NwpiContentView';

interface NwividPageProps {
  searchParams: {
    contentid?: string;
  };
}

export default async function NwividPage({ searchParams }: NwividPageProps) {
  const { contentid } = searchParams;

  if (!contentid) {
    notFound();
  }

  const supabase = createServerComponentClient({ cookies });

  // Get current user
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session) {
    redirect('/login');
  }

  // Get user record with internal ID
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('auth_id', session.user.id)
    .single();

  if (userError || !userData) {
    console.error('Error fetching user data:', userError);
    redirect('/login');
  }

  // Fetch the specific nwpi_content record
  const { data: contentData, error: contentError } = await supabase
    .from('nwpi_content')
    .select('*')
    .eq('id', contentid)
    .eq('fk_users_id', userData.id) // Security: ensure user owns this content
    .single();

  if (contentError || !contentData) {
    console.error('Error fetching content:', contentError);
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <NwpiContentView 
        content={contentData}
        userInternalId={userData.id}
      />
    </div>
  );
}