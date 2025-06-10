import React, { useEffect } from 'react';
import Header from '@/app/components/Header';
import { AuthProvider } from '@/app/context/AuthContext';
import ProtectedRoute from '@/app/components/ProtectedRoute';
import ProtectedLayout from '@/app/(protected)/layout';

const SitesJar1 = () => {
    useEffect(() => {
        // Set document title
        document.title = 'sitesjar1 - Snefuru';
    }, []);

    return (
        <AuthProvider>
            <ProtectedLayout>
                <h1 className="font-bold text-xl">. people</h1>
                {/* Additional content will be added here later */}
            </ProtectedLayout>
        </AuthProvider>
    );
};

export default SitesJar1; 