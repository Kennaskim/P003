"use client";
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { useParams } from 'next/navigation';

export default function AgreementDetailsPage() {
    const params = useParams();
    const agreementId = params.id as string;

    const { data: agreement, isLoading, error } = useQuery({
        queryKey: ['agreement', agreementId],
        queryFn: () => api.get(`/rental-agreements/${agreementId}`).then(res => res.data)
    });

    if (error) return <div className="p-6 text-red-500">Failed to load rental agreement details.</div>;

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Rental Agreement Details</h1>

            {isLoading ? (
                <p className="text-gray-500">Loading agreement...</p>
            ) : (
                <div className="bg-white p-6 border rounded-lg shadow-sm space-y-6">
                    <div className="flex justify-between items-center pb-4 border-b">
                        <div>
                            <p className="text-sm text-gray-500">Status</p>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${agreement?.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {agreement?.isActive ? 'ACTIVE' : 'INACTIVE'}
                            </span>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-gray-500">Rent Amount</p>
                            <p className="text-xl font-bold">KES {agreement?.rentAmount?.toLocaleString('en-KE')}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h3 className="font-semibold mb-2">Entities</h3>
                            <p><span className="text-gray-500">Unit:</span> {agreement?.unit?.name || 'Loading...'}</p>
                            <p><span className="text-gray-500">Renter:</span> {agreement?.renter?.firstName} {agreement?.renter?.lastName}</p>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-2">Terms</h3>
                            <p><span className="text-gray-500">Start Date:</span> {new Date(agreement?.startDate).toLocaleDateString()}</p>
                            <p><span className="text-gray-500">Payment Due:</span> Day {agreement?.paymentDueDay} of month</p>
                            <p><span className="text-gray-500">Deposit:</span> KES {agreement?.deposit?.toLocaleString('en-KE')} ({agreement?.depositPaid ? 'Paid' : 'Unpaid'})</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}