import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";
import { api } from "@/lib/axios";

export default function Header() {
    const { user, logout } = useAuthStore();
    const router = useRouter();

    const handleLogout = async () => {
        try {
            // Call the API to clear the httpOnly refresh cookie
            await api.post("/auth/logout");
        } catch (error) {
            console.error("Logout failed", error);
        } finally {
            // Always clear local state and redirect
            logout();
            router.push("/login");
        }
    };

    return (
        <header className="flex h-16 items-center justify-between border-b bg-white px-6">
            <h2 className="text-lg font-semibold text-gray-800">
                Property Management Portal
            </h2>
            <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <User className="h-5 w-5 rounded-full bg-gray-100 p-1" />
                    <span>{user?.role.replace("_", " ")}</span>
                </div>
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                </Button>
            </div>
        </header>
    );
}