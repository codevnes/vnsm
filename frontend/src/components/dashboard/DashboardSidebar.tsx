'use client'; // Make this a Client Component

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { SidebarNav } from "@/components/dashboard/SidebarNav";
import { Button } from "@/components/ui/button";
import { 
    LogOut, 
    Menu,
    X
} from "lucide-react";
import { 
    Sheet, 
    SheetContent, 
    SheetTrigger,
} from "@/components/ui/sheet";

export function DashboardSidebar() {
    const { logout } = useAuth(); // Get logout function from context
    const router = useRouter();
    const [open, setOpen] = useState(false);

    const handleLogout = () => {
        logout(); 
        router.push('/dang-nhap'); 
    };

    // Sidebar content component to reuse in both desktop and mobile views
    const SidebarContent = ({ mobile = false, onNavClick = () => {} }) => (
        <>
            <div className={`flex ${mobile ? 'h-[60px]' : 'h-[60px]'} items-center border-b px-6`}>
                <Link href="/" className="flex items-center gap-2 font-semibold" onClick={mobile ? onNavClick : undefined}>
                    {/* Replace with your App Logo/Name */}
                    <span className="">Your App</span>
                </Link>
            </div>
            <div className="flex-1 overflow-auto py-2">
                <nav className="grid items-start px-4 text-sm font-medium" onClick={mobile ? onNavClick : undefined}>
                    <SidebarNav />
                </nav>
            </div>
            <div className="mt-auto p-4 border-t">
                <Button size="sm" variant="ghost" className="w-full justify-start" onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Đăng xuất
                </Button>
            </div>
        </>
    );

    return (
        <>
            {/* Desktop Sidebar - Hidden on mobile */}
            <aside className="fixed inset-y-0 left-0 z-10 hidden w-72 flex-col border-r bg-background sm:flex">
                <SidebarContent />
            </aside>

            {/* Mobile Sidebar with Sheet - Visible only on mobile */}
            <div className="sm:hidden">
                <Sheet open={open} onOpenChange={setOpen}>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon" className="fixed top-3 left-3 z-40">
                            <Menu className="h-5 w-5" />
                            <span className="sr-only">Mở menu</span>
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-72 p-0">
                        <div className="flex h-full flex-col">
                            <SidebarContent mobile={true} onNavClick={() => setOpen(false)} />
                        </div>
                    </SheetContent>
                </Sheet>
            </div>
        </>
    );
}