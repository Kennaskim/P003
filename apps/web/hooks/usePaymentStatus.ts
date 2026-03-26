import { useState, useEffect, useCallback, useRef } from 'react';
import api from '@/lib/axios';

type PaymentStatus = 'idle' | 'polling' | 'completed' | 'failed' | 'timeout';

interface UsePaymentStatusOptions {
    /** Polling interval in ms (default: 3000) */
    interval?: number;
    /** Max polling duration in ms (default: 60000) */
    timeout?: number;
}

interface UsePaymentStatusReturn {
    status: PaymentStatus;
    payment: any | null;
    startPolling: (checkoutRequestId: string) => void;
    stopPolling: () => void;
}

/**
 * Hook to poll for M-Pesa STK Push payment status.
 * After initiating an STK push, call `startPolling(checkoutRequestId)`
 * to begin polling for the payment result.
 */
export function usePaymentStatus(options: UsePaymentStatusOptions = {}): UsePaymentStatusReturn {
    const { interval = 3000, timeout = 60000 } = options;

    const [status, setStatus] = useState<PaymentStatus>('idle');
    const [payment, setPayment] = useState<any | null>(null);

    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const checkoutIdRef = useRef<string | null>(null);

    const cleanup = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
    }, []);

    const stopPolling = useCallback(() => {
        cleanup();
        checkoutIdRef.current = null;
    }, [cleanup]);

    const poll = useCallback(async () => {
        if (!checkoutIdRef.current) return;

        try {
            const { data } = await api.get('/payments', {
                params: { checkoutRequestId: checkoutIdRef.current }
            });

            // The API may return an array or single payment
            const paymentResult = Array.isArray(data) ? data[0] : data?.data?.[0] || data;

            if (paymentResult && paymentResult.status === 'COMPLETED') {
                setPayment(paymentResult);
                setStatus('completed');
                cleanup();
                return;
            }

            if (paymentResult && (paymentResult.status === 'FAILED' || paymentResult.status === 'CANCELLED')) {
                setPayment(paymentResult);
                setStatus('failed');
                cleanup();
                return;
            }
        } catch (error) {
            // Silently continue polling — network hiccups shouldn't stop the poll
            console.warn('Payment status poll failed, retrying...', error);
        }
    }, [cleanup]);

    const startPolling = useCallback((checkoutRequestId: string) => {
        // Clear any existing poll
        cleanup();

        checkoutIdRef.current = checkoutRequestId;
        setStatus('polling');
        setPayment(null);

        // Start polling
        intervalRef.current = setInterval(poll, interval);

        // Set timeout to stop polling after max duration
        timeoutRef.current = setTimeout(() => {
            cleanup();
            setStatus('timeout');
        }, timeout);

        // Do an immediate first poll
        poll();
    }, [cleanup, poll, interval, timeout]);

    // Cleanup on unmount
    useEffect(() => {
        return cleanup;
    }, [cleanup]);

    return { status, payment, startPolling, stopPolling };
}
