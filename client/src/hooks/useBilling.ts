import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/http';

interface SubscriptionStatus {
    subscription_status: string;
    plan_id: string;
    current_period_end:string;
    trial_end:string;
}

export const useBilling = () => {
    const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
    const [loading, setLoading] = useState(true);

        const fetchSubscriptionStatus = useCallback(async () => {
        try {
                const response = (await api.get('/billing/subscription-status')) as any;
                setSubscriptionStatus(response?.data as SubscriptionStatus);
        } catch (error) {
            console.error('Error fetching subscription status:', error);
        } finally {
            setLoading(false);
        }
    }, []);

        const createCheckoutSession = useCallback(async (priceId: string, planId: string) => {
        try {
                const response = (await api.post('/billing/create-checkout-session', {
                priceId,
                planId,
                })) as any;
                return (response?.data?.sessionId as string) || '';
        } catch (error) {
            console.error('Error creating checkout session:', error);
            throw error;
        }
    }, []);

    useEffect(() => {
        fetchSubscriptionStatus();
    }, [fetchSubscriptionStatus]);

    return {
        subscriptionStatus,
        loading,
        createCheckoutSession,
        refetchStatus: fetchSubscriptionStatus,
    };
};