'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { LogOut } from 'lucide-react'; // Icon for logout

export default function DashboardPage() {
    const { isAuthenticated, loading, logout } = useAuth();
    const router = useRouter();

    useEffect(() => {
        // Only redirect if loading is complete and user is definitely not authenticated
        if (!loading && !isAuthenticated) {
            router.push('/login');
        }
    }, [isAuthenticated, loading, router]);

    const handleLogout = () => {
        logout(); // Use the logout function from context
        router.push('/login'); // Redirect to login page
    };

    // Show loading state while checking authentication
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                Loading...
            </div>
        );
    }

    // If not loading and not authenticated, we're redirecting, so render nothing
    if (!isAuthenticated) {
        return null;
    }

    // Render dashboard content if authenticated
    return (
        <div className="flex flex-col min-h-screen">
            {/* Header */}
            <header className="sticky top-0 z-10 flex items-center justify-between h-16 px-4 border-b bg-background md:px-6">
                <h1 className="text-lg font-semibold">Dashboard</h1>
                <Button variant="outline" size="icon" onClick={handleLogout}>
                    <LogOut className="w-4 h-4" />
                    <span className="sr-only">Logout</span>
                </Button>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 p-4 md:p-6 lg:p-8">
                {/* Grid for responsive cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {/* Example Cards - Replace with actual dashboard widgets */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Metric 1</CardTitle>
                            <CardDescription>Brief description</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold">1,234</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Metric 2</CardTitle>
                            <CardDescription>Brief description</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold">56.7%</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Metric 3</CardTitle>
                            <CardDescription>Brief description</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold">$9,876</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Another Widget</CardTitle>
                            <CardDescription>More details here</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {/* Placeholder for chart or table */}
                            <div className="p-4 text-center border rounded-md bg-muted">
                                Widget Content
                            </div>
                        </CardContent>
                    </Card>
                    {/* Add more cards/widgets as needed */}
                </div>
            </main>

            {/* Footer (Optional) */}
            <footer className="p-4 mt-auto text-center text-muted-foreground text-sm border-t">
                Your App Name &copy; {new Date().getFullYear()}
            </footer>
        </div>
    );
} 