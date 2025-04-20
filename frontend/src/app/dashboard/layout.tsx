import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import Link from "next/link";

// Optional: Add metadata for dashboard sections if needed
// export const metadata = { ... }

interface DashboardLayoutProps {
    children: React.ReactNode;
}

// This remains a Server Component
export default function DashboardLayout({
    children,
}: DashboardLayoutProps) {

    // TODO: Add real logout functionality (likely via useAuth hook)
    const handleLogout = () => {
        console.log("Logout clicked - implement me!");
        // Example: clear auth token, redirect
    };

    return (
        <div className="flex min-h-screen w-full flex-col bg-muted/40">
            {/* Render the Client Component Sidebar */}
            <DashboardSidebar />

            {/* Main Content Area */}
            <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-72"> {/* Adjust pl to match sidebar width */}
                {/* Mobile Header (Optional) - Shows on small screens */}
                <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
                    {/* Mobile Sidebar Toggle (Needs state management if implemented) */}
                    {/* <Sheet> ... </Sheet> */}
                    
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