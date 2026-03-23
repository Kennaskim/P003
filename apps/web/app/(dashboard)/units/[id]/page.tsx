"use client";
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { useParams } from 'next/navigation';

export default function UnitDetailsPage() {
    const params = useParams();
    const unitId = params.id as string;

    const { data: unit, isLoading, error } = useQuery({
        queryKey: ['unit', unitId],
        queryFn: () => api.get(`/units/${unitId}`).then(res => res.data)
    });

    if (error) return <div className="p-6 text-red-500">Failed to load unit details.</div>;

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Unit Details</h1>

            {isLoading ? (
                <p className="text-gray-500">Loading unit...</p>
            ) : (
                <div className="bg-white p-6 border rounded-lg shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h2 className="text-xl font-semibold">{unit?.name}</h2>
                            <p className="text-gray-500 text-sm">Property: {unit?.property?.name || 'Unknown Property'}</p>
                        </div>
                        <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
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
            )}
        </div>
    );
}