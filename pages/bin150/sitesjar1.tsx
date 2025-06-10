import React from 'react';
import Header from '@/app/components/Header';
import { AuthProvider } from '@/app/context/AuthContext';

const SitesJar1 = () => {
    return (
        <AuthProvider>
            <div>
                <Header />
                {/* Additional content will be added here later */}
            </div>
        </AuthProvider>
    );
};

export default SitesJar1; 