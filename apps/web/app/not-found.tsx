import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
    return (
        <div className="flex h-screen flex-col items-center justify-center space-y-4 bg-gray-50">
            <h2 className="text-4xl font-bold">404</h2>
            <p className="text-muted-foreground">This page or record could not be found.</p>
            <Button asChild>
                <Link href="/dashboard">Return to Dashboard</Link>
            </Button>
        </div>
    );
}