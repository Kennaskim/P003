"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Building,
    Building2,
    CreditCard,
    FileSignature,
    Home,
    LayoutDashboard,
    Settings,
    Users,
    Wrench,
    FileText,
    ShieldAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";

const mainNavigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Properties", href: "/properties", icon: Building },
    { name: "Units", href: "/units", icon: Home },
    { name: "Renters", href: "/renters", icon: Users },
    { name: "Agreements", href: "/agreements", icon: FileSignature },
    { name: "Billing & Invoices", href: "/billing", icon: CreditCard },
    { name: "Maintenance", href: "/maintenance", icon: Wrench },
    { name: "Documents", href: "/documents", icon: FileText },
    { name: "Reports", href: "/reports", icon: FileText },
    { name: "Settings", href: "/settings", icon: Settings },
];

const ownerNavigation = [
    { name: "Portfolio Overview", href: "/owner-portal/dashboard", icon: LayoutDashboard },
    { name: "Settings", href: "/settings", icon: Settings },
];

const adminNavigation = [
    { name: "SaaS Tenants", href: "/admin/tenants", icon: Building2 },
    { name: "Audit Logs", href: "/admin/audit-logs", icon: ShieldAlert },
];

export default function Sidebar() {
    const pathname = usePathname();
    const user = useAuthStore((state) => state.user);
    const isSuperAdmin = user?.role === "SUPER_ADMIN";
    const isLandlord = user?.role === "LANDLORD";

    // Determine which primary navigation to show based on user role
    const activeNavigation = isLandlord ? ownerNavigation : mainNavigation;

    return (
        <div className="flex h-full w-64 flex-col border-r bg-white">
            <div className="flex h-16 items-center justify-center border-b px-6">
                <h1 className="text-xl font-bold text-gray-900">RMS Kenya</h1>
            </div>
            <div className="flex-1 overflow-y-auto py-4">
                <nav className="space-y-1 px-3">
                    {/* STANDARD / OWNER NAVIGATION */}
                    {activeNavigation.map((item) => {
                        const isActive = pathname.startsWith(item.href);
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={cn(
                                    "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                                    isActive
                                        ? "bg-gray-100 text-blue-600"
                                        : "text-gray-700 hover:bg-gray-50 hover:text-blue-600"
                                )}
                            >
                                <item.icon
                                    className={cn(
                                        "mr-3 h-5 w-5 flex-shrink-0",
                                        isActive ? "text-blue-600" : "text-gray-400"
                                    )}
                                    aria-hidden="true"
                                />
                                {item.name}
                            </Link>
                        );
                    })}

                    {/* SUPER ADMIN NAVIGATION SECTION */}
                    {isSuperAdmin && (
                        <div className="pt-6 mt-6 border-t border-gray-200">
                            <h3 className="mb-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Platform Admin
                            </h3>
                            {adminNavigation.map((item) => {
                                const isActive = pathname.startsWith(item.href);
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className={cn(
                                            "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                                            isActive
                                                ? "bg-gray-100 text-blue-600"
                                                : "text-gray-700 hover:bg-gray-50 hover:text-blue-600"
                                        )}
                                    >
                                        <item.icon
                                            className={cn(
                                                "mr-3 h-5 w-5 flex-shrink-0",
                                                isActive ? "text-blue-600" : "text-gray-400"
                                            )}
                                            aria-hidden="true"
                                        />
                                        {item.name}
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </nav>
            </div>
        </div>
    );
}