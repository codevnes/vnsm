'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { 
    Home, 
    Image as ImageIcon, 
    Settings, 
    CandlestickChart, 
    BarChart2, 
    Folder, 
    FileText, 
    BarChart3, 
    BarChart4, 
    LineChart, 
    PieChart 
} from "lucide-react";

// Define navigation items
const sidebarNavItems = [
    {
        title: "Home",
        href: "/",
        icon: Home,
    },
    {
        title: "Overview",
        href: "/dashboard",
        icon: Home,
    },
    {
        title: "Posts",
        href: "/dashboard/posts",
        icon: FileText,
    },
    {
        title: "Categories",
        href: "/dashboard/categories",
        icon: Folder,
    },
    {
        title: "Media",
        href: "/dashboard/media",
        icon: ImageIcon,
    },
    {
        title: "Stocks",
        href: "/dashboard/stocks",
        icon: CandlestickChart,
    },
    {
        title: "Q-Indices",
        href: "/dashboard/qindices",
        icon: BarChart2,
    },
    {
        title: "EPS Records",
        href: "/dashboard/eps-records",
        icon: BarChart3,
    },
    {
        title: "PE Records",
        href: "/dashboard/pe-records",
        icon: LineChart,
    },
    {
        title: "ROA/ROE Records",
        href: "/dashboard/roa-roe-records",
        icon: BarChart4,
    },
    {
        title: "Financial Ratio",
        href: "/dashboard/financial-ratio-records",
        icon: PieChart,
    },
    {
        title: "Currency Prices",
        href: "/dashboard/currency-prices",
        icon: CandlestickChart,
    },
    {
        title: "Settings",
        href: "/dashboard/settings", // Example link
        icon: Settings,
    },
];

type SidebarNavProps = React.HTMLAttributes<HTMLElement>;

export function SidebarNav({ className, ...props }: SidebarNavProps) {
    const pathname = usePathname();

    return (
        <nav
            className={cn(
                "flex flex-col space-x-2 lg:space-x-0 lg:space-y-1",
                className
            )}
            {...props}
        >
            {sidebarNavItems.map((item) => (
                <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                        buttonVariants({ variant: "ghost" }),
                        pathname === item.href
                            ? "bg-muted hover:bg-muted"
                            : "hover:bg-transparent hover:underline",
                        "justify-start"
                    )}
                >
                    <item.icon className="mr-2 h-4 w-4" />
                    {item.title}
                </Link>
            ))}
        </nav>
    );
}