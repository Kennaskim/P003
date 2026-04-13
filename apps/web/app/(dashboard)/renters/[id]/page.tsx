"use client";
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

export default function RenterDetailsPage() {
    const params = useParams();
    const renterId = params.id as string;

    const { data: renter, isLoading: isRenterLoading, error } = useQuery({
        queryKey: ['renter', renterId],
        queryFn: () => api.get(`/renters/${renterId}`).then(res => res.data?.data || res.data)
    });

    // Fetches the full history for this specific renter.
    // By explicitly passing { renterId } and omitting { isActive }, 
    // the backend will now return both active and terminated agreements.
    const { data: agreements, isLoading: isAgreementsLoading } = useQuery({
        queryKey: ['renter-agreements', renterId],
        queryFn: () => api.get(`/rental-agreements`, { params: { renterId } }).then(res => res.data?.data || res.data),
        enabled: !!renterId,
    });

    if (error) return <div className="p-6 text-red-500">Failed to load renter details.</div>;

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Renter Profile</h1>

            {isRenterLoading ? (
                <p className="text-gray-500">Loading renter profile...</p>
            ) : (
                <div className="space-y-6">
                    {/* Personal Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white p-6 border rounded-lg shadow-sm">
                            <h2 className="text-lg font-semibold mb-4">Personal Information</h2>
                            <div className="space-y-3">
                                <p><span className="font-medium text-gray-500">Name:</span> {renter?.firstName} {renter?.lastName}</p>
                                <p><span className="font-medium text-gray-500">Phone:</span> {renter?.phone}</p>
                                <p><span className="font-medium text-gray-500">Email:</span> {renter?.email || 'N/A'}</p>
                                <p><span className="font-medium text-gray-500">ID ({renter?.idType}):</span> {renter?.nationalId}</p>
                                <p><span className="font-medium text-gray-500">Emergency Contact:</span> {renter?.emergencyContact || 'N/A'}</p>
                                <div className="flex items-center gap-2">
                                    <span className="font-medium text-gray-500">Status: </span>
                                    <Badge variant={
                                        renter?.status === 'ACTIVE' ? 'default' :
                                            renter?.status === 'EVICTED' ? 'destructive' :
                                                'secondary'
                                    }>
                                        {renter?.status}
                                    </Badge>
                                </div>
                            </div>
                        </div>

                        {/* Quick Stats */}
                        <div className="bg-white p-6 border rounded-lg shadow-sm">
                            <h2 className="text-lg font-semibold mb-4">Summary</h2>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center p-3 bg-blue-50 rounded">
                                    <span className="text-sm text-gray-600">Active Agreements</span>
                                    <span className="font-bold text-blue-700">
                                        {Array.isArray(agreements) ? agreements.filter((a: any) => a.isActive).length : 0}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                                    <span className="text-sm text-gray-600">Total Agreements (History)</span>
                                    <span className="font-bold text-gray-700">
                                        {Array.isArray(agreements) ? agreements.length : 0}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Rental Agreements */}
                    <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b">
                            <h2 className="text-lg font-semibold">Rental History</h2>
                        </div>

                        {isAgreementsLoading ? (
                            <div className="p-6 text-center text-gray-400">Loading history...</div>
                        ) : !Array.isArray(agreements) || agreements.length === 0 ? (
                            <div className="p-6 text-center text-gray-400">No rental agreements found.</div>
                        ) : (
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 text-left text-gray-500 uppercase tracking-wider text-xs">
                                    <tr>
                                        <th className="px-6 py-3">Unit</th>
                                        <th className="px-6 py-3">Rent</th>
                                        <th className="px-6 py-3">Start Date</th>
                                        <th className="px-6 py-3">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {agreements.map((ag: any) => (
                                        <tr key={ag.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <Link href={`/agreements/${ag.id}`} className="text-blue-600 hover:underline font-medium">
                                                    {ag.unit?.name || ag.unitId}
                                                </Link>
                                            </td>
                                            <td className="px-6 py-4">KES {ag.rentAmount?.toLocaleString('en-KE')}</td>
                                            <td className="px-6 py-4">{new Date(ag.startDate).toLocaleDateString()}</td>
                                            <td className="px-6 py-4">
                                                <Badge variant={ag.isActive ? "default" : "secondary"}>
                                                    {ag.isActive ? 'Active' : 'Terminated'}
                                                </Badge>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}