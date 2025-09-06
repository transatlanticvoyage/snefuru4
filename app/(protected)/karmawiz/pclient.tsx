'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import LandingPage from './components/LandingPage';
import WizardStep from './components/WizardStep';

interface KarmaWizardSession {
  session_id: string;
  session_name: string;
  rel_gcon_piece_id: string;
  user_id: string;
  steps_completed: number;
  step_left_off_at: number;
  total_steps_planned: number;
  session_status: string;
  created_at: string;
  updated_at: string;
}

export default function KarmawizClient() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userInternalId, setUserInternalId] = useState<string | null>(null);
  const [currentSession, setCurrentSession] = useState<KarmaWizardSession | null>(null);
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [matchingGconPieces, setMatchingGconPieces] = useState<any[]>([]);

  const supabase = createClientComponentClient();

  // Parse URL parameters
  const wizsessionParam = searchParams.get('wizsession');
  const stepParam = searchParams.get('step');
  const sourceUrlParam = searchParams.get('sourceUrl');
  const currentStep = stepParam ? parseInt(stepParam, 10) : null;

  // Get user internal ID
  const fetchUserInternalId = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!authUser?.id) {
        setError('User not authenticated');
        setLoading(false);
        return;
      }

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', authUser.id)
        .single();

      if (userError || !userData) {
        console.error('User lookup error:', userError);
        setError('User not found in users table');
        setLoading(false);
        return;
      }

      setUserInternalId(userData.id);
      return userData.id;
    } catch (error) {
      console.error('Error fetching user:', error);
      setError('Failed to fetch user data');
      setLoading(false);
      return null;
    }
  };

  // Search for matching gcon_pieces based on source URL
  const searchForMatchingGconPieces = async (url: string, userId: string) => {
    try {
      // Search gcon_pieces for matching URLs
      const { data: pieces, error } = await supabase
        .from('gcon_pieces')
        .select('id, meta_title, h1title, asn_sitespren_base, pageurl, pageslug, created_at')
        .eq('fk_users_id', userId)
        .or(`asn_sitespren_base.ilike.%${url}%,pageurl.ilike.%${url}%`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error searching gcon_pieces:', error);
        return [];
      }

      setMatchingGconPieces(pieces || []);
      return pieces || [];
    } catch (error) {
      console.error('Error searching for matching content:', error);
      return [];
    }
  };

  // Fetch session data if wizsession param is present
  const fetchSession = async (sessionId: string, userId: string) => {
    try {
      const { data: sessionData, error: sessionError } = await supabase
        .from('karma_wizard_sessions')
        .select('*')
        .eq('session_id', sessionId)
        .eq('user_id', userId)
        .single();

      if (sessionError) {
        console.error('Session lookup error:', sessionError);
        setError('Session not found or access denied');
        return null;
      }

      setCurrentSession(sessionData);
      return sessionData;
    } catch (error) {
      console.error('Error fetching session:', error);
      setError('Failed to fetch session data');
      return null;
    }
  };

  // Initialize page data
  useEffect(() => {
    const initializePage = async () => {
      if (!user) {
        router.push('/login');
        return;
      }

      setLoading(true);
      setError(null);

      const userId = await fetchUserInternalId();
      if (!userId) return;

      // If we have a sourceUrl param, search for matching content and store it
      if (sourceUrlParam) {
        setSourceUrl(sourceUrlParam);
        await searchForMatchingGconPieces(sourceUrlParam, userId);
      }

      // If we have a wizsession param, fetch that session
      if (wizsessionParam) {
        const session = await fetchSession(wizsessionParam, userId);
        if (!session) {
          // Invalid session, redirect to landing page
          router.push('/karmawiz');
          return;
        }

        // If no step param but we have a session, redirect to the step they left off at
        if (!stepParam) {
          router.push(`/karmawiz?wizsession=${wizsessionParam}&step=${session.step_left_off_at}`);
          return;
        }

        // Validate step number
        if (currentStep && (currentStep < 1 || currentStep > session.total_steps_planned)) {
          setError(`Invalid step number. Must be between 1 and ${session.total_steps_planned}`);
          setLoading(false);
          return;
        }
      }

      setLoading(false);
    };

    initializePage();
  }, [user, router, wizsessionParam, stepParam, currentStep, sourceUrlParam]);

  // Create new session
  const createNewSession = async (gconPieceId: string, sessionName: string = 'New Karma Wizard Session') => {
    if (!userInternalId) {
      setError('User not authenticated');
      return;
    }

    try {
      setLoading(true);

      // Validate that gcon_piece exists (optional - you might want to skip this check)
      const { data: gconPiece, error: gconError } = await supabase
        .from('gcon_pieces')
        .select('id')
        .eq('id', gconPieceId)
        .single();

      if (gconError) {
        setError('Invalid gcon_piece_id. Please check the ID and try again.');
        setLoading(false);
        return;
      }

      // Create new session
      const { data: newSession, error: createError } = await supabase
        .from('karma_wizard_sessions')
        .insert({
          session_name: sessionName,
          rel_gcon_piece_id: gconPieceId,
          user_id: userInternalId,
          session_status: 'active',
          steps_completed: 0,
          step_left_off_at: 1,
          total_steps_planned: 4
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating session:', createError);
        setError(`Error creating session: ${createError.message}`);
        setLoading(false);
        return;
      }

      // Redirect to step 1 of the new session
      router.push(`/karmawiz?wizsession=${newSession.session_id}&step=1`);
      
    } catch (error) {
      console.error('Error creating session:', error);
      setError('Failed to create session');
      setLoading(false);
    }
  };

  // Update session progress
  const updateSessionProgress = async (stepNumber: number, completed: boolean = false) => {
    if (!currentSession) return;

    try {
      const updateData: any = {
        step_left_off_at: stepNumber,
        updated_at: new Date().toISOString(),
        last_activity_at: new Date().toISOString()
      };

      if (completed && stepNumber > currentSession.steps_completed) {
        updateData.steps_completed = stepNumber;
        
        // If all steps completed, mark session as completed
        if (stepNumber === currentSession.total_steps_planned) {
          updateData.session_status = 'completed';
          updateData.completed_at = new Date().toISOString();
          updateData.completion_percentage = 100;
        } else {
          updateData.completion_percentage = Math.round((stepNumber / currentSession.total_steps_planned) * 100);
        }
      }

      const { error } = await supabase
        .from('karma_wizard_sessions')
        .update(updateData)
        .eq('session_id', currentSession.session_id);

      if (error) {
        console.error('Error updating session progress:', error);
        return;
      }

      // Update local session state
      setCurrentSession(prev => prev ? { 
        ...prev, 
        ...updateData,
        steps_completed: updateData.steps_completed || prev.steps_completed
      } : null);

    } catch (error) {
      console.error('Error updating session progress:', error);
    }
  };

  // Navigate to next/previous step
  const navigateToStep = (stepNumber: number) => {
    if (!currentSession) return;

    if (stepNumber < 1 || stepNumber > currentSession.total_steps_planned) {
      return;
    }

    // Update session progress
    updateSessionProgress(stepNumber);

    // Navigate to the step
    router.push(`/karmawiz?wizsession=${currentSession.session_id}&step=${stepNumber}`);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">Loading Karma Wizard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl text-red-600 mb-4">Error: {error}</div>
          <button
            onClick={() => router.push('/karmawiz')}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  // Show landing page if no session/step params
  if (!wizsessionParam && !stepParam) {
    return (
      <LandingPage 
        onCreateSession={createNewSession}
        loading={loading}
        sourceUrl={sourceUrl}
        matchingGconPieces={matchingGconPieces}
      />
    );
  }

  // Show wizard step if we have both session and step
  if (currentSession && currentStep) {
    return (
      <WizardStep
        session={currentSession}
        currentStep={currentStep}
        onNavigateToStep={navigateToStep}
        onUpdateProgress={updateSessionProgress}
      />
    );
  }

  // Fallback - shouldn't reach here normally
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-xl">Invalid wizard state</div>
    </div>
  );
}