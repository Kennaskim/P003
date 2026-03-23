"use client";
import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { toast } from 'sonner';

export default function MpesaPolling({ checkoutRequestId, onSuccess }: { checkoutRequestId: string, onSuccess: () => void }) {
    const [status, setStatus] = useState<'PENDING' | 'SUCCESS' | 'FAILED'>('PENDING');

    useEffect(() => {
        if (!checkoutRequestId || status !== 'PENDING') return;

        const interval = setInterval(async () => {
            try {
                const res = await api.get(`/mpesa/status/${checkoutRequestId}`);
                if (res.data.status === 'COMPLETED') {
                    setStatus('SUCCESS');
                    toast.success("Payment successful!");
                    onSuccess();
                    clearInterval(interval);
                } else if (res.data.status === 'FAILED') {
                    setStatus('FAILED');
                    toast.error("Payment failed or cancelled.");
                    clearInterval(interval);
                }
            } catch (err) {
                console.error("Polling error", err);
            }
        }, 3000); // Poll every 3 seconds

        return () => clearInterval(interval);
    }, [checkoutRequestId, status, onSuccess]);

    return (
        <div className="p-4 bg-gray-50 border rounded text-center">
            {status === 'PENDING' && <p className="animate-pulse">Check your phone to enter M-Pesa PIN...</p>}
            {status === 'SUCCESS' && <p className="text-green-600 font-bold">Payment Verified!</p>}
            {status === 'FAILED' && <p className="text-red-600 font-bold">Payment Failed.</p>}
        </div>
    );
}