import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/http';

interface SubscriptionStatus {
    subscription_status: string;
    plan_id: string;
    stripe_subscription_id?: string;
    current_period_start?: string;
    current_period_end:string;
    trial_end:string;
}

export const useBilling = () => {
    const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
    const [loading, setLoading] = useState(true);

        const fetchSubscriptionStatus = useCallback(async () => {
        try {
                const response = (await api.get('/billing/subscription-status')) as any;
                // http client returns parsed JSON directly (not { data })
                setSubscriptionStatus(response as SubscriptionStatus);
        } catch (error) {
            console.error('Error fetching subscription status:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    const createCheckoutSession = useCallback(async (priceId: string, planId: string, opts?: { isTrial?: boolean }) => {
        try {
                const response = (await api.post('/billing/create-checkout-session', {
                priceId,
                planId,
        isTrial: opts?.isTrial === true,
                })) as any;
                // Expect { sessionId: string }
                return (response?.sessionId as string) || '';
        } catch (error) {
            console.error('Error creating checkout session:', error);
            throw error;
        }
    }, []);

    const cancelSubscription = useCallback(async () => {
        await api.post('/billing/cancel-subscription', {});
        await fetchSubscriptionStatus();
    }, [fetchSubscriptionStatus]);

    const resumeSubscription = useCallback(async () => {
        await api.post('/billing/resume-subscription', {});
        await fetchSubscriptionStatus();
    }, [fetchSubscriptionStatus]);

    const cancelSubscriptionNow = useCallback(async () => {
        await api.post('/billing/cancel-subscription-now', {});
        await fetchSubscriptionStatus();
    }, [fetchSubscriptionStatus]);

    useEffect(() => {
        fetchSubscriptionStatus();
    }, [fetchSubscriptionStatus]);

    return {
        subscriptionStatus,
        loading,
        createCheckoutSession,
        refetchStatus: fetchSubscriptionStatus,
        cancelSubscription,
        resumeSubscription,
        cancelSubscriptionNow,
    };
};