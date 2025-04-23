'use client'; // Convert to Client Component

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { LoaderCircle } from 'lucide-react';

// Optional: Add metadata for dashboard sections if needed
// export const metadata = { ... }

interface DashboardLayoutProps {
    children: React.ReactNode;
}

export default function DashboardLayout({
    children,
}: DashboardLayoutProps) {
    const { isAuthenticated, loading } = useAuth();
    const router = useRouter();

    // Check authentication at the layout level
    useEffect(() => {
        // Log authentication state for debugging
        console.log('Dashboard layout auth state:', { isAuthenticated, loading });

        if (!loading && !isAuthenticated) {
            // Get the current path to redirect back after login
            const currentPath = window.location.pathname;
            console.log('Redirecting to login with path:', currentPath);

            // Redirect to login with the current path as the redirect parameter
            router.push(`/login?redirect=${encodeURIComponent(currentPath)}`);
        }
    }, [isAuthenticated, loading, router]);

    // Show loading state while checking authentication
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <LoaderCircle className="w-8 h-8 animate-spin mr-2" />
                <span>Loading...</span>
            </div>
        );
    }

    // If not authenticated and not loading, we're redirecting, so render nothing
    if (!isAuthenticated) {
        return null;
    }

    // Render dashboard layout if authenticated
    return (
        <div className="flex min-h-screen w-full flex-col bg-muted/40">
            {/* Render the Client Component Sidebar */}
            <DashboardSidebar />

            {/* Main Content Area */}
            <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-72"> {/* Adjust pl to match sidebar width */}
                {/* Mobile Header - Shows on small screens */}
                <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
                    {/* Space for mobile menu button */}
                    <div className="w-8 sm:hidden"></div>

                    <div className="flex-1">
                        {/* Can add Breadcrumbs or search here */}
                    </div>
                    <div>
                        {/* User profile dropdown/button can go here */}
                    </div>
                </header>

                {/* Render the specific page content */}
                <main className="flex-1 p-4 sm:px-6 sm:py-0 md:gap-8">
                    {children}
                </main>

                {/* Optional Footer within main content area */}
                <footer className="text-center text-sm text-muted-foreground p-4">
                    Your App &copy; {new Date().getFullYear()}
                </footer>
            </div>
        </div>
    );
}