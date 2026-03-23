"use client";
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { useParams } from 'next/navigation';

export default function RenterDetailsPage() {
    const params = useParams();
    const renterId = params.id as string;

    const { data: renter, isLoading, error } = useQuery({
        queryKey: ['renter', renterId],
        queryFn: () => api.get(`/renters/${renterId}`).then(res => res.data)
    });

    if (error) return <div className="p-6 text-red-500">Failed to load renter details.</div>;

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Renter Profile</h1>

            {isLoading ? (
                <p className="text-gray-500">Loading renter profile...</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-6 border rounded-lg shadow-sm">
                        <h2 className="text-lg font-semibold mb-4">Personal Information</h2>
                        <div className="space-y-3">
                            <p><span className="font-medium text-gray-500">Name:</span> {renter?.firstName} {renter?.lastName}</p>
                            <p><span className="font-medium text-gray-500">Phone:</span> {renter?.phone}</p>
                            <p><span className="font-medium text-gray-500">Email:</span> {renter?.email || 'N/A'}</p>
                            <p><span className="font-medium text-gray-500">ID ({renter?.idType}):</span> {renter?.nationalId}</p>
                            <p>
                                <span className="font-medium text-gray-500">Status: </span>
                                <span className={`px-2 py-1 rounded text-xs font-medium ${renter?.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                    {renter?.status}
                                </span>
                            </p>
                        </div>
                    </div>
                    {/* Placeholder for future components like Payment History or Active Agreements */}
                    <div className="bg-gray-50 p-6 border rounded-lg shadow-sm flex items-center justify-center text-gray-400">
                        Payment History / Agreements (Coming Soon)
                    </div>
                </div>
            )}
        </div>
    );
}