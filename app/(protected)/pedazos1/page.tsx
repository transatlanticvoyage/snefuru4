'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import GconPiecesTable from "./components/GconPiecesTable";
import { cfunc_215_createpiece } from "./utils/cfunc_215_createpiece";

export default function Pedazos1Page() {
  const [gconPieces, setGconPieces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);
  const { user } = useAuth();
  const supabase = createClientComponentClient();

  useEffect(() => {
    document.title = '/pedazos1 - Snefuru';
    
    // Add custom styles to make main element full width for this page only
    const style = document.createElement('style');
    style.textContent = `
      body > div.min-h-screen.bg-gray-50 > main {
        margin-left: 8px !important;
        margin-right: 0px !important;
        padding-left: 0px !important;
        padding-right: 0px !important;
        max-width: none !important;
        width: calc(100vw - 8px) !important;
        position: relative !important;
      }
      
      /* Ensure content fills available width on all screen sizes */
      @media (min-width: 1280px) {
        body > div.min-h-screen.bg-gray-50 > main {
          width: calc(100vw - 8px) !important;
        }
      }
      
      /* For ultra-wide monitors (27-inch and larger) */
      @media (min-width: 1920px) {
        body > div.min-h-screen.bg-gray-50 > main {
          width: calc(100vw - 8px) !important;
        }
      }
    `;
    document.head.appendChild(style);
    
    // Cleanup function to remove the style when component unmounts
    return () => {
      document.head.removeChild(style);
    };
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

  // Function to refetch data after creating new piece
  const refetchGconPieces = async () => {
    if (!user?.id) return;

    try {
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();

      if (userData) {
        const { data: gconPieces, error } = await supabase
          .from("gcon_pieces")
          .select("*")
          .eq("fk_users_id", userData.id)
          .order("created_at", { ascending: false });

        if (!error && gconPieces) {
          setGconPieces(gconPieces);
        }
      }
    } catch (err) {
      console.error("Error refetching data:", err);
    }
  };

  // Handle create new piece
  const handleCreateNewPiece = async () => {
    if (!user?.id) return;

    setIsCreating(true);
    setNotification(null);

    try {
      const result = await cfunc_215_createpiece(user.id);
      
      if (result.success) {
        setNotification({
          type: 'success',
          message: 'New content piece created successfully!'
        });
        // Refetch data to update the table
        await refetchGconPieces();
      } else {
        setNotification({
          type: 'error',
          message: result.error || 'Failed to create content piece'
        });
      }
    } catch (error) {
      console.error('Error creating piece:', error);
      setNotification({
        type: 'error',
        message: 'An error occurred while creating the content piece'
      });
    } finally {
      setIsCreating(false);
      // Clear notification after 5 seconds
      setTimeout(() => setNotification(null), 5000);
    }
  };

  if (!user) {
    return (
      <div className="p-4">
        <div className="text-center">
          <p>Please sign in to view your content pieces.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-4">
        <div className="text-center">
          <p>Loading content pieces...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="text-center text-red-600">
          <p>Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pr-4">
      {/* Notification */}
      {notification && (
        <div className={`mb-4 p-4 rounded-md ${
          notification.type === 'success' 
            ? 'bg-green-100 border border-green-400 text-green-700' 
            : 'bg-red-100 border border-red-400 text-red-700'
        }`}>
          {notification.message}
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Content Pieces</h1>
        <div className="flex justify-between items-center">
          <p className="text-gray-600">
            Manage your article content for future publishing
          </p>
          <button
            onClick={handleCreateNewPiece}
            disabled={isCreating}
            className="px-4 py-2 bg-green-800 hover:bg-green-900 disabled:bg-green-600 text-white font-bold rounded-md transition-colors"
          >
            {isCreating ? 'Creating...' : 'func_215_createpiece'}
          </button>
        </div>
      </div>

      <GconPiecesTable 
        initialData={gconPieces} 
        userId={user.id}
      />
    </div>
  );
}