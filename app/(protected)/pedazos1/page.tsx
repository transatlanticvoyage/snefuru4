'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import GconPiecesTable from "./components/GconPiecesTable";

export default function Pedazos1Page() {
  const [gconPieces, setGconPieces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const supabase = createClientComponentClient();

  useEffect(() => {
    document.title = 'Content Pieces - Snefuru';
  }, []);

  useEffect(() => {
    const fetchGconPieces = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        // First get the internal user ID
        const { data: userData } = await supabase
          .from('users')
          .select('id')
          .eq('auth_id', user.id)
          .single();

        if (!userData) {
          setError('User not found');
          setLoading(false);
          return;
        }

        // Fetch user's gcon_pieces data
        const { data: gconPieces, error } = await supabase
          .from("gcon_pieces")
          .select("*")
          .eq("fk_users_id", userData.id)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching gcon_pieces:", error);
          setError("Error fetching content pieces");
        } else {
          setGconPieces(gconPieces || []);
        }
      } catch (err) {
        console.error("Error:", err);
        setError("An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchGconPieces();
  }, [user?.id, supabase]);

  if (!user) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center">
          <p>Please sign in to view your content pieces.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center">
          <p>Loading content pieces...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center text-red-600">
          <p>Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Content Pieces</h1>
        <p className="text-gray-600">
          Manage your article content for future publishing
        </p>
      </div>

      <GconPiecesTable 
        initialData={gconPieces} 
        userId={user.id}
      />
    </div>
  );
}