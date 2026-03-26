"use client";
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function AgreementDetailsPage() {
    const params = useParams();
    const agreementId = params.id as string;

    const { data: agreement, isLoading, error } = useQuery({
        queryKey: ['agreement', agreementId],
        queryFn: () => api.get(`/rental-agreements/${agreementId}`).then(res => res.data?.data || res.data)
    });

    const { data: invoices } = useQuery({
        queryKey: ['agreement-invoices', agreementId],
        queryFn: () => api.get(`/invoices`, { params: { rentalAgreementId: agreementId } }).then(res => res.data?.data || res.data),
        enabled: !!agreementId,
    });

    const { data: payments } = useQuery({
        queryKey: ['agreement-payments', agreementId],
        queryFn: () => api.get(`/payments`, { params: { rentalAgreementId: agreementId } }).then(res => res.data?.data || res.data),
        enabled: !!agreementId,
    });

    if (error) return <div className="p-6 text-red-500">Failed to load rental agreement details.</div>;

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Rental Agreement Details</h1>

            {isLoading ? (
                <p className="text-gray-500">Loading agreement...</p>
            ) : (
                <div className="space-y-6">
                    {/* Agreement Header */}
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
                                <p>
                                    <span className="text-gray-500">Unit: </span>
                                    <Link href={`/units/${agreement?.unitId}`} className="text-blue-600 hover:underline">
                                        {agreement?.unit?.name || agreement?.unitId}
                                    </Link>
                                </p>
                                <p>
                                    <span className="text-gray-500">Renter: </span>
                                    <Link href={`/renters/${agreement?.renterId}`} className="text-blue-600 hover:underline">
                                        {agreement?.renter?.firstName} {agreement?.renter?.lastName}
                                    </Link>
                                </p>
                            </div>
                            <div>
                                <h3 className="font-semibold mb-2">Terms</h3>
                                <p><span className="text-gray-500">Start Date:</span> {new Date(agreement?.startDate).toLocaleDateString()}</p>
                                <p><span className="text-gray-500">End Date:</span> {agreement?.endDate ? new Date(agreement.endDate).toLocaleDateString() : 'Rolling (month-to-month)'}</p>
                                <p><span className="text-gray-500">Payment Due:</span> Day {agreement?.paymentDueDay} of month</p>
                                <p><span className="text-gray-500">Grace Period:</span> {agreement?.gracePeriodDays} days</p>
                                <p><span className="text-gray-500">Deposit:</span> KES {agreement?.deposit?.toLocaleString('en-KE')} ({agreement?.depositPaid ? '✅ Paid' : '❌ Unpaid'})</p>
                                {agreement?.lateFeeAmount > 0 && (
                                    <p><span className="text-gray-500">Late Fee:</span> KES {agreement?.lateFeeAmount?.toLocaleString('en-KE')}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Invoices */}
                    <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b">
                            <h2 className="text-lg font-semibold">Invoices</h2>
                        </div>
                        {!Array.isArray(invoices) || invoices.length === 0 ? (
                            <div className="p-6 text-center text-gray-400">No invoices found for this agreement.</div>
                        ) : (
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 text-left text-gray-500 uppercase tracking-wider text-xs">
                                    <tr>
                                        <th className="px-6 py-3">Invoice #</th>
                                        <th className="px-6 py-3">Period</th>
                                        <th className="px-6 py-3">Amount</th>
                                        <th className="px-6 py-3">Due Date</th>
                                        <th className="px-6 py-3">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {invoices.map((inv: any) => (
                                        <tr key={inv.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 font-medium">{inv.invoiceNumber}</td>
                                            <td className="px-6 py-4">{inv.period}</td>
                                            <td className="px-6 py-4">KES {inv.amount?.toLocaleString('en-KE')}</td>
                                            <td className="px-6 py-4">{new Date(inv.dueDate).toLocaleDateString()}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded text-xs font-medium ${inv.isPaid ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                    {inv.isPaid ? 'PAID' : 'UNPAID'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* Payments */}
                    <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b">
                            <h2 className="text-lg font-semibold">Payment History</h2>
                        </div>
                        {!Array.isArray(payments) || payments.length === 0 ? (
                            <div className="p-6 text-center text-gray-400">No payments recorded for this agreement.</div>
                        ) : (
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 text-left text-gray-500 uppercase tracking-wider text-xs">
                                    <tr>
                                        <th className="px-6 py-3">Date</th>
                                        <th className="px-6 py-3">Amount</th>
                                        <th className="px-6 py-3">Method</th>
                                        <th className="px-6 py-3">Receipt</th>
                                        <th className="px-6 py-3">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {payments.map((pmt: any) => (
                                        <tr key={pmt.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">{new Date(pmt.createdAt).toLocaleDateString()}</td>
                                            <td className="px-6 py-4 font-medium">KES {pmt.amount?.toLocaleString('en-KE')}</td>
                                            <td className="px-6 py-4">{pmt.method}</td>
                                            <td className="px-6 py-4 text-gray-500">{pmt.mpesaReceipt || '—'}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                                    pmt.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                                                    pmt.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                                    pmt.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                                                    'bg-gray-100 text-gray-800'
                                                }`}>
                                                    {pmt.status}
                                                </span>
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