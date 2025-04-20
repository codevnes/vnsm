'use client';

import React from 'react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

export default function DashboardPage() {
    // Authentication is now checked at the layout level
    // No need for authentication checks in individual pages

    return (
        <div className="flex flex-col min-h-screen">

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
        </div>
    );
}