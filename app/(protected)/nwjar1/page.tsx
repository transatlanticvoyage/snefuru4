import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import NwpiContentTable from './components/NwpiContentTable';
import NwpiPusherButton from './components/NwpiPusherButton';

export const metadata = {
  title: '/nwjar1 - Snefuru'
};

export default async function NwJar1Page() {
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

  // Fetch nwpi_content data for this user
  const { data: nwpiContent, error: contentError } = await supabase
    .from('nwpi_content')
    .select('*')
    .eq('fk_users_id', userData.id)
    .order('i_sync_completed_at', { ascending: false });

  if (contentError) {
    console.error('Error fetching nwpi_content:', contentError);
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">/nwjar1 - sync table 1 - (WPSv2)</h1>
            <p className="mt-2 text-gray-600">
              View and manage your synced WordPress content from the nwpi_content table
            </p>
            <p className="mt-1 text-sm text-gray-500">
              db table: nwpi_content
            </p>
          </div>
          <div className="flex-shrink-0 ml-6">
            <NwpiPusherButton 
              data={nwpiContent || []} 
              userId={userData.id}
            />
          </div>
        </div>
      </div>

      {nwpiContent && nwpiContent.length > 0 ? (
        <NwpiContentTable 
          data={nwpiContent} 
          userId={userData.id}
        />
      ) : (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500">
            No synced content found. Use the sync buttons on the sitejar4 page to sync your WordPress sites.
          </p>
        </div>
      )}
    </div>
  );
}