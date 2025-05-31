"use client";
import { useEffect, useState } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// Define the columns based on the schema
const columns = [
  'id',
  'rel_users_id',
  'created_at',
  'note1',
];

export default function Rungi1Page() {
  const { user } = useAuth();
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const fetchBatches = async () => {
      setLoading(true);
      setError(null);
      try {
        if (!user?.id) {
          setBatches([]);
          setLoading(false);
          return;
        }
        // Get user's DB id from users table
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('auth_id', user.id)
          .single();
        if (userError || !userData) {
          setError('Could not find user record.');
          setBatches([]);
          setLoading(false);
          return;
        }
        // Fetch images_plans_batches for this user
        const { data, error } = await supabase
          .from('images_plans_batches')
          .select('*')
          .eq('rel_users_id', userData.id)
          .order('created_at', { ascending: false });
        if (error) throw error;
        setBatches(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch batches');
        setBatches([]);
      } finally {
        setLoading(false);
      }
    };
    fetchBatches();
  }, [user, supabase]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map(col => (
              <th key={col} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{col}</th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {batches.map(batch => (
            <tr key={batch.id}>
              {columns.map(col => (
                <td key={col} className="px-4 py-2 whitespace-nowrap">{String(batch[col] ?? '')}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {batches.length === 0 && <div className="mt-4 text-gray-500">No batches found for your user.</div>}
    </div>
  );
} 