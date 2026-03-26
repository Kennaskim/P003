"use client";
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function UnitDetailsPage() {
    const params = useParams();
    const unitId = params.id as string;

    const { data: unit, isLoading, error } = useQuery({
        queryKey: ['unit', unitId],
        queryFn: () => api.get(`/units/${unitId}`).then(res => res.data?.data || res.data)
    });

    const { data: agreements } = useQuery({
        queryKey: ['unit-agreements', unitId],
        queryFn: () => api.get(`/rental-agreements`, { params: { unitId } }).then(res => res.data?.data || res.data),
        enabled: !!unitId,
    });

    const { data: maintenanceReqs } = useQuery({
        queryKey: ['unit-maintenance', unitId],
        queryFn: () => api.get(`/maintenance`, { params: { unitId } }).then(res => res.data?.data || res.data),
        enabled: !!unitId,
    });

    if (error) return <div className="p-6 text-red-500">Failed to load unit details.</div>;

    const activeAgreement = Array.isArray(agreements) ? agreements.find((a: any) => a.isActive) : null;

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Unit Details</h1>

            {isLoading ? (
                <p className="text-gray-500">Loading unit...</p>
            ) : (
                <div className="space-y-6">
                    {/* Unit Info */}
                    <div className="bg-white p-6 border rounded-lg shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h2 className="text-xl font-semibold">{unit?.name}</h2>
                                <p className="text-gray-500 text-sm">Property: {unit?.property?.name || 'Unknown Property'}</p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                unit?.status === 'OCCUPIED' ? 'bg-green-100 text-green-800' :
                                unit?.status === 'VACANT' ? 'bg-blue-100 text-blue-800' :
                                unit?.status === 'MAINTENANCE' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                            }`}>
                                {unit?.status}
                            </span>
                        </div>

                        <div className="mt-6 border-t pt-4">
                            <h3 className="text-sm font-medium text-gray-500">Standard Rent Amount</h3>
                            <p className="mt-1 text-2xl font-bold text-gray-900">
                                KES {unit?.rentAmount?.toLocaleString('en-KE')}
                            </p>
                        </div>
                    </div>

                    {/* Active Agreement */}
                    {activeAgreement && (
                        <div className="bg-white p-6 border rounded-lg shadow-sm">
                            <h2 className="text-lg font-semibold mb-4">Active Agreement</h2>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                    <p className="text-sm text-gray-500">Renter</p>
                                    <Link href={`/renters/${activeAgreement.renterId}`} className="text-blue-600 hover:underline font-medium">
                                        {activeAgreement.renter?.firstName} {activeAgreement.renter?.lastName}
                                    </Link>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Rent</p>
                                    <p className="font-medium">KES {activeAgreement.rentAmount?.toLocaleString('en-KE')}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Start Date</p>
                                    <p className="font-medium">{new Date(activeAgreement.startDate).toLocaleDateString()}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Agreement</p>
                                    <Link href={`/agreements/${activeAgreement.id}`} className="text-blue-600 hover:underline font-medium text-sm">
                                        View Details →
                                    </Link>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Maintenance Requests */}
                    <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b">
                            <h2 className="text-lg font-semibold">Maintenance Requests</h2>
                        </div>
                        {!Array.isArray(maintenanceReqs) || maintenanceReqs.length === 0 ? (
                            <div className="p-6 text-center text-gray-400">No maintenance requests for this unit.</div>
                        ) : (
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 text-left text-gray-500 uppercase tracking-wider text-xs">
                                    <tr>
                                        <th className="px-6 py-3">Category</th>
                                        <th className="px-6 py-3">Description</th>
                                        <th className="px-6 py-3">Urgency</th>
                                        <th className="px-6 py-3">Status</th>
                                        <th className="px-6 py-3">Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {maintenanceReqs.map((req: any) => (
                                        <tr key={req.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 font-medium">{req.category}</td>
                                            <td className="px-6 py-4 text-gray-600 truncate max-w-xs">{req.description}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                                    req.urgency === 'Critical' ? 'bg-red-100 text-red-800' :
                                                    req.urgency === 'High' ? 'bg-orange-100 text-orange-800' :
                                                    'bg-gray-100 text-gray-800'
                                                }`}>
                                                    {req.urgency}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                                    req.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                                                    req.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                                                    'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                    {req.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-gray-500">{new Date(req.createdAt).toLocaleDateString()}</td>
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