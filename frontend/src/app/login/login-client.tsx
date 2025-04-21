'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { useState, useEffect } from "react";
import { getErrorMessage } from "@/types/error";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

// Define the validation schema using Zod
const formSchema = z.object({
    email: z.string().email({ message: "Invalid email address." }),
    password: z.string().min(1, { message: "Password is required." }),
});

// Define the API endpoint
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export default function LoginClient() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { setToken, isAuthenticated, loading } = useAuth();
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Get the redirect URL from query params if available
    const redirectPath = searchParams ? (searchParams.get('redirect') || '/dashboard') : '/dashboard';

    // Redirect to dashboard if already authenticated
    useEffect(() => {
        if (!loading && isAuthenticated) {
            router.push(redirectPath);
        }
    }, [isAuthenticated, loading, router, redirectPath]);

    // Initialize the form
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    // Handle form submission
    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(values),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || response.statusText || 'Login failed');
            }

            setToken(data.token);
            router.push(redirectPath);

        } catch (err: unknown) {
            console.error("Login error:", err);
            setError(getErrorMessage(err) || "An unexpected error occurred.");
        } finally {
            setIsLoading(false);
        }
    }

    // Show loading state while checking authentication
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    // Don't show login form if already authenticated
    if (isAuthenticated) {
        return null; // Will redirect via useEffect
    }

    return (
        <div className="flex items-center justify-center min-h-screen">
            <Card className="w-[350px]">
                <CardHeader>
                    <CardTitle>Login</CardTitle>
                    <CardDescription>Enter your credentials to access your account.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email</FormLabel>
                                        <FormControl>
                                            <Input type="email" placeholder="john.doe@example.com" {...field} disabled={isLoading} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Password</FormLabel>
                                        <FormControl>
                                            <Input type="password" placeholder="••••••••" {...field} disabled={isLoading} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            {error && (
                                <p className="text-sm font-medium text-destructive">{error}</p>
                            )}
                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? 'Logging in...' : 'Login'}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
                <CardFooter className="flex flex-col items-center space-y-2">
                    <p className="text-sm text-muted-foreground">
                        Don&apos;t have an account?{' '}
                        <Link href="/register" className="underline underline-offset-4 hover:text-primary">
                            Register
                        </Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}