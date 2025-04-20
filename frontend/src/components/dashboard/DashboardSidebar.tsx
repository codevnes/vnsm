'use client'; // Make this a Client Component

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { SidebarNav } from "@/components/dashboard/SidebarNav";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export function DashboardSidebar() {
    const { logout } = useAuth(); // Get logout function from context
    const router = useRouter();

    const handleLogout = () => {
        logout(); // Use the logout function from context
        router.push('/login'); // Redirect to login page
        // Optionally add a notification here
    };

    return (
        <aside className="fixed inset-y-0 left-0 z-10 hidden w-72 flex-col border-r bg-background sm:flex">
            <div className="flex h-[60px] items-center border-b px-6">
                <Link href="/" className="flex items-center gap-2 font-semibold">
                    {/* Replace with your App Logo/Name */}
                    <span className="">Your App</span>
                </Link>
                {/* Optional: Add notification icon/button here */}
            </div>
            <div className="flex-1 overflow-auto py-2">
                <nav className="grid items-start px-4 text-sm font-medium">
                    <SidebarNav />
                </nav>
            </div>
             <div className="mt-auto p-4 border-t">
                <Button size="sm" variant="ghost" className="w-full justify-start" onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                </Button>
             </div>
        </aside>
    );
} 