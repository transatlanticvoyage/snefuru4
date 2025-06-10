import React, { useEffect } from 'react';
import Header from '@/app/components/Header';
import { AuthProvider } from '@/app/context/AuthContext';
import ProtectedRoute from '@/app/components/ProtectedRoute';

const SitesJar1 = () => {
    useEffect(() => {
        // Set document title
        document.title = 'sitesjar1 - Snefuru';
    }, []);

    return (
        <AuthProvider>
            <ProtectedRoute>
                <div className="min-h-screen bg-gray-50">
                    <Header />
                    <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                        <h1 className="font-bold text-xl">. people</h1>
                        {/* Additional content will be added here later */}
                    </main>
                </div>
            </ProtectedRoute>
        </AuthProvider>
    );
};

export default SitesJar1; 