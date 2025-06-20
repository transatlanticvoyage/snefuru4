'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '@/lib/supabase';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

type Profile = {
  id: string;
  full_name: string;
  avatar_url: string;
  updated_at: string;
};

type UserSettings = {
  id: string;
  email: string;
  sidebar_menu_active: boolean;
};

export default function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fullName, setFullName] = useState('');
  const [sidebarMenuActive, setSidebarMenuActive] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const supabaseClient = createClientComponentClient();

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!user) return;

        // Fetch profile data
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          throw profileError;
        }
        
        setProfile(profileData);
        setFullName(profileData?.full_name || '');

        // Fetch user settings from users table
        const { data: userData, error: userError } = await supabaseClient
          .from('users')
          .select('id, email, sidebar_menu_active')
          .eq('auth_id', user.id)
          .single();

        if (userError) throw userError;
        
        setUserSettings(userData);
        setSidebarMenuActive(userData?.sidebar_menu_active || false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, supabaseClient]);

  useEffect(() => {
    // Set document title
    document.title = 'profile - Snefuru';
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: fullName,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
      
      setProfile(prev => prev ? { ...prev, full_name: fullName } : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSidebarToggle = async (newValue: boolean) => {
    if (!userSettings) return;

    setSidebarMenuActive(newValue);
    
    try {
      const { error } = await supabaseClient
        .from('users')
        .update({ sidebar_menu_active: newValue })
        .eq('id', userSettings.id);

      if (error) throw error;
      
      setUserSettings(prev => prev ? { ...prev, sidebar_menu_active: newValue } : null);
    } catch (err) {
      // Revert on error
      setSidebarMenuActive(!newValue);
      setError(err instanceof Error ? err.message : 'Failed to update sidebar setting');
    }
  };

  if (loading) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">Profile Settings</h1>
        
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <form onSubmit={handleSaveProfile}>
              {error && (
                <div className="mb-4 rounded-md bg-red-50 p-4">
                  <div className="text-sm text-red-700">{error}</div>
                </div>
              )}
              
              <div className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <div className="mt-1">
                    <input
                      type="email"
                      name="email"
                      id="email"
                      value={user?.email || ''}
                      disabled
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-gray-50"
                    />
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    Your email address cannot be changed.
                  </p>
                </div>

                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                    Full Name
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      name="fullName"
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Sidebar Menu Settings */}
        <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Sidebar Menu Settings</h3>
            
            <div className="flex items-center justify-between">
              <div className="flex-grow">
                <label htmlFor="sidebar-toggle" className="block text-sm font-medium text-gray-700">
                  sidebar_menu_active
                </label>
                <p className="text-sm text-gray-500 mt-1">
                  Toggle the sidebar menu on/off for all pages
                </p>
              </div>
              
              <div className="ml-4">
                <button
                  type="button"
                  onClick={() => handleSidebarToggle(!sidebarMenuActive)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                    sidebarMenuActive ? 'bg-green-600' : 'bg-gray-200'
                  }`}
                  role="switch"
                  aria-checked={sidebarMenuActive}
                  aria-labelledby="sidebar-toggle"
                >
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition duration-200 ease-in-out ${
                      sidebarMenuActive ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 